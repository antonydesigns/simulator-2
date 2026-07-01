/* ─── App: wires the game loop, table, and persistence ─── */

// ── DOM refs ──
const $fromMw = document.getElementById('fromMw');
const $toMw = document.getElementById('toMw');
const $durationSec = document.getElementById('durationSec');
const $btnStart = document.getElementById('btnStart');
const $btnPause = document.getElementById('btnPause');
const $btnRestart = document.getElementById('btnRestart');
const $btnExport = document.getElementById('btnExportCsv');
const $btnSave = document.getElementById('btnSave');
const $btnLoad = document.getElementById('btnLoad');
const $btnDelete = document.getElementById('btnDelete');
const $loadSelect = document.getElementById('loadSelect');
const $tableHeader = document.getElementById('tableHeader');
const $tableBody = document.getElementById('tableBody');

// ── State ──
let ramp = null;
let series = new TimeSeries();
let runCounter = 0;
let loopId = null;
let running = false;

const TICK_MS = 100; // 10 Hz
const DT = TICK_MS / 1000; // 0.1s per tick

// ── Game loop ──
function gameLoop() {
  if (!ramp || ramp.isComplete || !running) return;

  const state = ramp.step(DT);
  series.record(state.time, state.mw);

  updateTable();

  if (state.done) {
    stopLoop();
    onRunComplete();
  }
}

function startLoop() {
  if (loopId) return;
  running = true;
  loopId = setInterval(gameLoop, TICK_MS);
}

function stopLoop() {
  if (loopId) {
    clearInterval(loopId);
    loopId = null;
  }
  running = false;
}

// ── UI updates ──
function updateTable() {
  // Build header
  const labels = series.runLabels;
  let headerHtml = '<th>Time (s)</th>';
  for (const label of labels) {
    headerHtml += `<th>${label} (MW)</th>`;
  }
  $tableHeader.innerHTML = headerHtml;

  // Build body
  const rows = series.getTableData();
  let bodyHtml = '';
  for (const row of rows) {
    let cells = `<td>${row.t.toFixed(3)}</td>`;
    for (const label of labels) {
      const v = row.values[label];
      cells += `<td>${v !== null ? v.toFixed(3) : '—'}</td>`;
    }
    bodyHtml += `<tr>${cells}</tr>`;
  }
  $tableBody.innerHTML = bodyHtml;

  // Auto-scroll to bottom
  const tc = document.getElementById('table-container');
  tc.scrollTop = tc.scrollHeight;
}

function setConfigEnabled(enabled) {
  $fromMw.disabled = !enabled;
  $toMw.disabled = !enabled;
  $durationSec.disabled = !enabled;
}

function onRunComplete() {
  $btnSave.disabled = false;
  $btnExport.disabled = false;
  $btnStart.disabled = true;
  $btnPause.disabled = true;
  $btnRestart.disabled = false;
}

// ── Button handlers ──

/** Start — begins a new ramp or resumes a paused one. */
$btnStart.addEventListener('click', () => {
  const from = parseFloat($fromMw.value);
  const to = parseFloat($toMw.value);
  const dur = parseFloat($durationSec.value);

  if (isNaN(from) || isNaN(to) || isNaN(dur) || dur <= 0) {
    alert('Enter valid From/To MW and Duration > 0');
    return;
  }

  if (!ramp || ramp.isComplete) {
    // Fresh run
    runCounter++;
    ramp = new LoadRamp(from, to, dur);
    series.startRun(`Run ${runCounter}`);
    setConfigEnabled(false);
  } else if (ramp.isPaused) {
    // Resume
    ramp.resume();
  } else {
    return; // already running
  }

  $btnStart.disabled = true;
  $btnPause.disabled = false;
  $btnRestart.disabled = false;
  $btnSave.disabled = true;
  $btnExport.disabled = true;

  startLoop();
});

/** Pause — pauses the current ramp. */
$btnPause.addEventListener('click', () => {
  if (!ramp || ramp.isComplete) return;
  stopLoop();
  ramp.pause();
  $btnStart.disabled = false;
  $btnStart.textContent = 'Resume';
  $btnPause.disabled = true;
});

/** Restart — hard reset. */
$btnRestart.addEventListener('click', () => {
  stopLoop();

  ramp = null;
  series.clear();
  runCounter = 0;

  $tableHeader.innerHTML = '<th>Time (s)</th>';
  $tableBody.innerHTML = '';

  setConfigEnabled(true);
  $btnStart.disabled = false;
  $btnStart.textContent = 'Start';
  $btnPause.disabled = true;
  $btnRestart.disabled = true;
  $btnSave.disabled = true;
  $btnExport.disabled = true;
});

// ── Toolbar handlers ──

/** Export CSV */
$btnExport.addEventListener('click', () => {
  const csv = series.toCSV();
  if (!csv) return;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grid-sim-ramp-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

/** Save Session — prompts for name. */
$btnSave.addEventListener('click', () => {
  const name = prompt('Session name:');
  if (!name || !name.trim()) return;

  const ok = Persister.save(name.trim(), series);
  if (!ok) {
    alert('Failed to save — localStorage might be full.');
    return;
  }
  refreshSessionList();
  alert(`Session "${name}" saved.`);
});

/** Load Session */
$btnLoad.addEventListener('click', () => {
  const name = $loadSelect.value;
  if (!name) return;

  // Confirm if current data will be lost
  if (series.pointCount > 0 && !confirm('Replace current data with saved session?')) return;

  // Stop anything running
  stopLoop();
  ramp = null;
  runCounter = 0;

  const loaded = Persister.load(name);
  if (!loaded) {
    alert('Session not found.');
    return;
  }

  series = loaded;

  // Restore config to inputs
  $fromMw.value = series.config.fromMW;
  $toMw.value = series.config.toMW;
  $durationSec.value = series.config.durationSec;

  // Rebuild UI
  updateTable();
  setConfigEnabled(true);

  // Reset buttons
  $btnStart.disabled = false;
  $btnStart.textContent = 'Start';
  $btnPause.disabled = true;
  $btnRestart.disabled = false;
  $btnSave.disabled = false;
  $btnExport.disabled = false;

  alert(`Session "${name}" loaded (${series.pointCount} data points).`);
});

/** Delete Session */
$btnDelete.addEventListener('click', () => {
  const name = $loadSelect.value;
  if (!name) return;
  if (!confirm(`Delete session "${name}"?`)) return;

  Persister.delete(name);
  refreshSessionList();
  alert(`Session "${name}" deleted.`);
});

/** Session list refresh */
function refreshSessionList() {
  const names = Persister.list();
  $loadSelect.innerHTML = '<option value="">— saved sessions —</option>';
  for (const name of names) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    $loadSelect.appendChild(opt);
  }
  $btnLoad.disabled = names.length === 0;
  $btnDelete.disabled = names.length === 0;
}

// ── Init ──
refreshSessionList();
console.log('Grid Sim V2 ready — configure a ramp and hit Start.');
