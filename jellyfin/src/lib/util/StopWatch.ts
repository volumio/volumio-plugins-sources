/**
 * Note: this is not a general-purpose utility class, but one made specifically for
 * keeping track of the seek position in MPD 'stop' events handled by PlayController.
 */

export default class StopWatch {
  #startTimestamp: number;
  #stopTimestamp: number;
  #startElapsedMS: number;
  #status: 'running' | 'stopped';

  constructor() {
    this.#status = 'stopped';
    this.#startTimestamp = this.#stopTimestamp = this.#getCurrentTimestamp();
  }

  start(startElapsedMS = 0) {
    this.#startTimestamp = this.#stopTimestamp = this.#getCurrentTimestamp();
    this.#startElapsedMS = startElapsedMS;
    this.#status = 'running';
    return this;
  }

  stop() {
    if (this.#status !== 'stopped') {
      this.#stopTimestamp = this.#getCurrentTimestamp();
      this.#status = 'stopped';
    }
    return this;
  }

  getElapsed() {
    if (this.#status === 'stopped') {
      return this.#stopTimestamp - this.#startTimestamp + this.#startElapsedMS;
    }

    // Status: 'running'
    return this.#getCurrentTimestamp() - this.#startTimestamp + this.#startElapsedMS;
  }

  #getCurrentTimestamp() {
    return new Date().getTime();
  }
}
