# Plan: Simulator V2 — Load Ramp + Time Series

**Tech stack:** Static HTML + Chart.js (CDN), vanilla JS. No build step. Firebase-ready structure.

## Goal
A single-page simulator: configure a load ramp, run it, see the time series as both a chart AND a readable table UI. Save/load sessions.

## Architecture
```
simulator-v2/
├── index.html          # Entry — Chart.js CDN, layout (inputs, chart, table, controls)
├── style.css           # Minimal dark theme, scrollable table
├── app.js              # Main: model + UI wiring
├── LoadRamp.js         # Load model: tick loop, ramp calculation
├── TimeSeries.js       # Data capture, CSV export, JSON serialization
└── Persister.js        # Save/load sessions (localStorage, Firebase-ready structure)
```

## UI Layout (vertical stack)
1. **Config bar** — From MW, To MW, Duration (sec), [Start] [Pause] [Restart]
2. **Chart** — Chart.js line chart (load MW vs time)
3. **Data table** — scrollable table: `Time (s) | Load (MW)`. Each run adds a column
4. **Toolbar** — Export CSV | Save Session | Load Session dropdown | New Run

## Checklist

### Step 1 — index.html + style.css
- Chart.js from CDN
- Inputs: `fromMwh`, `toMwh`, `durationSec` (disabled while running, re-enabled on restart)
- [Start] [Pause] [Restart] buttons, Export CSV, Save/Load session controls
- Chart canvas + scrollable `<table>` below it
- Dark theme, fixed-height table with overflow scroll

### Step 2 — LoadRamp.js
- `class LoadRamp { constructor(fromMW, toMW, durationSec) }`
- `start()` — begins game loop at 10Hz (100ms interval)
- `pause()` — pauses loop, preserves elapsed time
- `restart()` — resets elapsed to 0, stops loop
- Game loop: each tick runs `step(0.1)` (100ms = 0.1s of sim time)
- `step(dt)` → `current = from + (to - from) * (elapsed / duration)` → `{ time, mw }`
- `isComplete` flag when elapsed ≥ duration

### Step 3 — TimeSeries.js
- `class TimeSeries { constructor(config?) }`
- `record(time, mw)` — push `{ t, mw }`
- `getData()` → `{ labels: [time, ...], datasets: [{label, data: [mw, ...]}] }`
- `getTableData()` → `[{t, mw, runLabel}]` for table rendering
- `exportCSV()` — download CSV
- `toJSON()` / `fromJSON(data)` — serialize/deserialize
- Multiple run support: each run gets a `runId` and label

### Step 4 — app.js
- Game loop manager: owns the 10Hz interval, talks to LoadRamp
- **[Start]** — create LoadRamp (or resume if paused), start game loop
- **[Pause]** — calls `loadRamp.pause()`, stops interval
- **[Restart]** — resets everything, clears chart + table, enables config editing
- At each tick: `timeSeries.record(time, mw)`, update chart dataset, append table row
- On completion: auto-pause, enable save/export
- Config inputs are disabled while running, re-enabled on restart

### Step 5 — Persister.js
- `saveSession()` — serialize TimeSeries + config → localStorage key `simv2-session-{name}`
- `loadSession(name)` — restore, populate chart + table from saved data
- `listSessions()` — populate Load dropdown
- `deleteSession(name)`
- JSON structure: `{ id, createdAt, config: {fromMW, toMW, durationSec}, runs: [{ label, data: [{t, mw}] }] }`

### Step 6 — Table UI polish
- Table auto-scrolls to latest row during live run
- Columns: Time (s) | Run 1 (MW) | Run 2 (MW) ... each run is a column
- Config bar hides after run starts (or collapses)
- Export includes all runs as CSV

## Edge cases
- Duration=0 → single data point
- fromMW===toMW → flat line
- Multiple runs → appended as new columns on same table + new dataset on chart
- Pause mid-ramp → data up to that point preserved, resume continues from same point
- Restart mid-ramp → discards current data entirely, fresh session
- localStorage quota → warn at 50 sessions
