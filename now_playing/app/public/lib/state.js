import { registry } from './registry.js';

export class State {

    constructor() {
        let self = this;
        
        self.currentState = null;
        self.emitter = new EventEmitter();

        registry.socket.on('pushState', data => {
            let oldState = data;
            self.currentState = data;
            self.emitter.emitEvent('stateChanged', [data, oldState]);
        });
    }

    static init() {
        return new State();
    }

    get() {
        return this.currentState;
    }

    on(event, handler) {
        this.emitter.addListener(event, handler);
    }

    off(event, handler) {
        this.emitter.removeListener(event, handler);
    }
}

