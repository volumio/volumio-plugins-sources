import { MPDApi } from 'mpd-api';
import { Logger } from 'yt-cast-receiver';

export type SubsystemName = 'database' |
                            'update' |
                            'stored_playlist' |
                            'playlist' |
                            'player' |
                            'mixer' |
                            'output' |
                            'options' |
                            'partition' |
                            'sticker' |
                            'subscription' |
                            'message' |
                            'neighbor' |
                            'mount';

interface SubsystemEventListener {
  (event: SubsystemEvent): Promise<void>;
}

interface __SubsystemEventListener {
  once: boolean;
  callback: SubsystemEventListener;
}

export class SubsystemEvent {
  #name: string;
  #propagate: boolean;

  constructor(name: string, propagate = true) {
    this.#name = name;
    this.#propagate = propagate;
  }

  stopPropagation() {
    this.#propagate = false;
  }

  get propagate(): boolean {
    return this.#propagate;
  }

  get name(): string {
    return this.#name;
  }
}

export default class MPDSubsystemEventEmitter {

  #status: 'running' | 'stopped' | 'destroyed';
  #mpdClient: MPDApi.ClientAPI | null;
  #logger: Logger;
  #systemEventListener: (subsystem: SubsystemName) => Promise<void>;
  #subsystemEventListeners: {[subsystem: string]: __SubsystemEventListener[]};

  constructor(logger: Logger) {
    this.#logger = logger;
    this.#status = 'stopped';
    this.#mpdClient = null;
    this.#systemEventListener = this.#handleSystemEvent.bind(this);
    this.#subsystemEventListeners = {};
  }

  static instance(mpdClient: MPDApi.ClientAPI, logger: Logger) {
    const emitter = new MPDSubsystemEventEmitter(logger);
    emitter.#mpdClient = mpdClient;
    return emitter;
  }

  #assertOK(c: MPDApi.ClientAPI | null): c is MPDApi.ClientAPI {
    if (this.#status === 'destroyed') {
      throw Error('Instance destroyed');
    }
    if (!this.#mpdClient) {
      throw Error('MPD client not set');
    }
    return true;
  }

  enable() {
    if (this.#assertOK(this.#mpdClient) && this.#status === 'stopped') {
      this.#mpdClient.on('system', this.#systemEventListener);
      this.#status = 'running';
      this.#logger.debug('[ytcr] MPDSubsystemEventEmitter enabled.');
    }
  }

  disable() {
    if (this.#assertOK(this.#mpdClient)) {
      this.#status = 'stopped';
      this.#mpdClient?.removeListener('system', this.#systemEventListener);
      this.#logger.debug('[ytcr] MPDSubsystemEventEmitter disabled.');
    }
  }

  #addSubsystemEventListener(event: SubsystemName, listener: SubsystemEventListener, once = false, prepend = false) {
    if (!this.#subsystemEventListeners[event]) {
      this.#subsystemEventListeners[event] = [];
    }
    const wrapped = {
      once,
      callback: listener
    };
    if (prepend) {
      this.#subsystemEventListeners[event].unshift(wrapped);
    }
    else {
      this.#subsystemEventListeners[event].push(wrapped);
    }
  }

  on(event: SubsystemName, listener: SubsystemEventListener): this {
    this.#addSubsystemEventListener(event, listener);
    return this;
  }


  once(event: SubsystemName, listener: SubsystemEventListener): this {
    this.#addSubsystemEventListener(event, listener, true);
    return this;
  }

  off(event: SubsystemName, listener: SubsystemEventListener): this {
    const listeners = this.#subsystemEventListeners[event];
    if (!listeners) {
      return this;
    }

    this.#subsystemEventListeners[event] = listeners.filter((l) => l.callback !== listener);
    return this;
  }

  prependOnceListener(event: SubsystemName, listener: SubsystemEventListener): this {
    this.#addSubsystemEventListener(event, listener, true, true);
    return this;
  }

  destroy() {
    if (this.#status === 'destroyed') {
      return;
    }
    this.#status = 'destroyed';
    this.#mpdClient?.removeListener('system', this.#systemEventListener);
    this.#subsystemEventListeners = {};
    this.#mpdClient = null;
    this.#logger.debug('[ytcr] MPDSubsystemEventEmitter destroyed.');
  }

  async #handleSystemEvent(subsystem: SubsystemName) {
    if (this.#status === 'running') {
      const listeners = this.#subsystemEventListeners[subsystem];
      if (!listeners) {
        return;
      }

      this.#logger.debug(`[ytcr] MPDSubsystemEventEmitter invoking ${listeners.length} SubsystemEventListener callbacks for: ${subsystem}`);

      for (let i = 0; i < listeners.length; i++) {
        const l = listeners[i];
        const event = new SubsystemEvent(subsystem);
        try {
          const callbackResult = l.callback(event);
          if (callbackResult.then !== undefined) {
            await callbackResult;
          }
        }
        catch (error) {
          this.#logger.debug('[ytcr] MPDSubsystemEventEmitter handleSystemEvent error:', error);
        }
        if (!event.propagate) {
          this.#logger.debug('[ytcr] SubsystemEvent.propagate: false. Event propagation stopped.');
          break;
        }
      }

      this.#subsystemEventListeners[subsystem] = listeners.filter((l) => !l.once);
    }
  }
}
