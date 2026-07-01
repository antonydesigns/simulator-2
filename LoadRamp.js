/**
 * LoadRamp — Models a load ramp from fromMW → toMW over durationSec.
 * Runs as a 10Hz game loop via start/pause/restart.
 */
class LoadRamp {
  constructor(fromMW, toMW, durationSec) {
    this.fromMW = fromMW;
    this.toMW = toMW;
    this.durationSec = durationSec;
    this._elapsed = 0;
    this._paused = false;
    this._done = false;
  }

  /** Start (or resume) the ramp. Returns current state. */
  step(dt) {
    if (this._done || this._paused) return this.state;

    this._elapsed += dt;
    if (this._elapsed >= this.durationSec) {
      this._elapsed = this.durationSec;
      this._done = true;
    }
    return this.state;
  }

  /** Reset to initial state. */
  reset() {
    this._elapsed = 0;
    this._paused = false;
    this._done = false;
  }

  pause() {
    this._paused = true;
  }

  resume() {
    this._paused = false;
  }

  get isComplete() {
    return this._done;
  }

  get isPaused() {
    return this._paused;
  }

  get currentMW() {
    if (this.durationSec <= 0) return this.toMW;
    const t = Math.min(this._elapsed / this.durationSec, 1);
    return this.fromMW + (this.toMW - this.fromMW) * t;
  }

  get elapsed() {
    return this._elapsed;
  }

  get state() {
    return {
      time: this._elapsed,
      mw: this.currentMW,
      done: this._done,
      paused: this._paused,
    };
  }
}
