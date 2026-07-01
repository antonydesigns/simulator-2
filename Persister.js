/**
 * Persister — Save/load time series sessions via localStorage.
 * Structure is Firebase-ready: { id, createdAt, config, runs }.
 */
class Persister {
  static STORAGE_PREFIX = 'simv2-session-';

  /** Save a TimeSeries as a named session. */
  static save(name, timeSeries) {
    if (!name || !name.trim()) return false;
    const key = this.STORAGE_PREFIX + name.trim();
    const data = {
      id: name.trim(),
      createdAt: new Date().toISOString(),
      ...timeSeries.toJSON(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
        return false;
      }
      throw e;
    }
  }

  /** Load a named session into a TimeSeries instance. */
  static load(name) {
    const key = this.STORAGE_PREFIX + name;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw);
    const ts = new TimeSeries(data.config);
    ts.fromJSON(data);
    return ts;
  }

  /** List all saved session names. */
  static list() {
    const names = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        names.push(key.slice(this.STORAGE_PREFIX.length));
      }
    }
    return names.sort();
  }

  /** Delete a named session. */
  static delete(name) {
    localStorage.removeItem(this.STORAGE_PREFIX + name);
  }

  /** Get approximate storage usage info. */
  static storageInfo() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        total += localStorage.getItem(key).length;
      }
    }
    return { bytesUsed: total, sessionCount: this.list().length };
  }
}
