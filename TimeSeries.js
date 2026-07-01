/**
 * TimeSeries — Records and manages time-series data across multiple runs.
 * Serializes to JSON for persistence. Exports to CSV.
 */
class TimeSeries {
  constructor(config = {}) {
    this.config = {
      fromMW: config.fromMW ?? 0,
      toMW: config.toMW ?? 0,
      durationSec: config.durationSec ?? 0,
    };
    this.runs = [];
    this._activeRun = null;
  }

  /** Start a new run with a label. */
  startRun(label) {
    const run = { label, data: [] };
    this.runs.push(run);
    this._activeRun = run;
    return run;
  }

  /** Record a data point on the active run. */
  record(time, mw) {
    if (!this._activeRun) return;
    this._activeRun.data.push({ t: time, mw });
  }

  /** Get data formatted for Chart.js: { labels, datasets } */
  getChartData() {
    // Collect all unique time points across all runs
    const allTimes = new Set();
    for (const run of this.runs) {
      for (const d of run.data) allTimes.add(d.t);
    }
    const labels = [...allTimes].sort((a, b) => a - b);

    // Build a map per run
    const datasets = this.runs.map((run, i) => {
      const map = new Map(run.data.map(d => [d.t, d.mw]));
      const data = labels.map(t => map.has(t) ? map.get(t) : null);
      const hue = (i * 60) % 360;
      return {
        label: run.label,
        data,
        borderColor: `hsl(${hue}, 70%, 55%)`,
        backgroundColor: `hsla(${hue}, 70%, 55%, 0.1)`,
        fill: false,
        tension: 0,
        pointRadius: 0,
        spanGaps: false,
      };
    });

    return { labels, datasets };
  }

  /** Get data for table rendering: array of { t, values: {runLabel: mw} } */
  getTableData() {
    // Collect all time points
    const timeSet = new Set();
    const runDataMaps = this.runs.map(run => {
      const map = new Map();
      for (const d of run.data) {
        timeSet.add(d.t);
        map.set(d.t, d.mw);
      }
      return { label: run.label, map };
    });

    const times = [...timeSet].sort((a, b) => a - b);
    return times.map(t => {
      const row = { t };
      row.values = {};
      for (const rdm of runDataMaps) {
        row.values[rdm.label] = rdm.map.has(t) ? rdm.map.get(t) : null;
      }
      return row;
    });
  }

  /** Get run labels */
  get runLabels() {
    return this.runs.map(r => r.label);
  }

  /** Export all data as a CSV string */
  toCSV() {
    if (this.runs.length === 0) return '';

    const labels = ['Time (s)', ...this.runs.map(r => r.label + ' (MW)')];
    const rows = [labels.join(',')];

    const tableData = this.getTableData();
    for (const row of tableData) {
      const vals = [row.t.toFixed(3), ...this.runs.map(r => {
        const v = row.values[r.label];
        return v !== null ? v.toFixed(3) : '';
      })];
      rows.push(vals.join(','));
    }
    return rows.join('\n');
  }

  /** Serialize to JSON */
  toJSON() {
    return {
      config: { ...this.config },
      runs: this.runs.map(r => ({
        label: r.label,
        data: r.data.map(d => ({ t: d.t, mw: d.mw })),
      })),
    };
  }

  /** Restore from JSON */
  fromJSON(json) {
    this.config = { ...json.config };
    this.runs = json.runs.map(r => ({
      label: r.label,
      data: r.data.map(d => ({ t: d.t, mw: d.mw })),
    }));
    this._activeRun = null;
  }

  /** Clear all data */
  clear() {
    this.runs = [];
    this._activeRun = null;
  }

  /** Get total data point count */
  get pointCount() {
    return this.runs.reduce((sum, r) => sum + r.data.length, 0);
  }
}
