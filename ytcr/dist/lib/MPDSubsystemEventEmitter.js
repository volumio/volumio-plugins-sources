"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SubsystemEvent_name, _SubsystemEvent_propagate, _MPDSubsystemEventEmitter_instances, _MPDSubsystemEventEmitter_status, _MPDSubsystemEventEmitter_mpdClient, _MPDSubsystemEventEmitter_logger, _MPDSubsystemEventEmitter_systemEventListener, _MPDSubsystemEventEmitter_subsystemEventListeners, _MPDSubsystemEventEmitter_assertOK, _MPDSubsystemEventEmitter_addSubsystemEventListener, _MPDSubsystemEventEmitter_handleSystemEvent;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubsystemEvent = void 0;
class SubsystemEvent {
    constructor(name, propagate = true) {
        _SubsystemEvent_name.set(this, void 0);
        _SubsystemEvent_propagate.set(this, void 0);
        __classPrivateFieldSet(this, _SubsystemEvent_name, name, "f");
        __classPrivateFieldSet(this, _SubsystemEvent_propagate, propagate, "f");
    }
    stopPropagation() {
        __classPrivateFieldSet(this, _SubsystemEvent_propagate, false, "f");
    }
    get propagate() {
        return __classPrivateFieldGet(this, _SubsystemEvent_propagate, "f");
    }
    get name() {
        return __classPrivateFieldGet(this, _SubsystemEvent_name, "f");
    }
}
exports.SubsystemEvent = SubsystemEvent;
_SubsystemEvent_name = new WeakMap(), _SubsystemEvent_propagate = new WeakMap();
class MPDSubsystemEventEmitter {
    constructor(logger) {
        _MPDSubsystemEventEmitter_instances.add(this);
        _MPDSubsystemEventEmitter_status.set(this, void 0);
        _MPDSubsystemEventEmitter_mpdClient.set(this, void 0);
        _MPDSubsystemEventEmitter_logger.set(this, void 0);
        _MPDSubsystemEventEmitter_systemEventListener.set(this, void 0);
        _MPDSubsystemEventEmitter_subsystemEventListeners.set(this, void 0);
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_logger, logger, "f");
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_status, 'stopped', "f");
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_mpdClient, null, "f");
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_systemEventListener, __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_handleSystemEvent).bind(this), "f");
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, {}, "f");
    }
    static instance(mpdClient, logger) {
        const emitter = new MPDSubsystemEventEmitter(logger);
        __classPrivateFieldSet(emitter, _MPDSubsystemEventEmitter_mpdClient, mpdClient, "f");
        return emitter;
    }
    enable() {
        if (__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_assertOK).call(this, __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f")) && __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_status, "f") === 'stopped') {
            __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f").on('system', __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_systemEventListener, "f"));
            __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_status, 'running', "f");
            __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug('[ytcr] MPDSubsystemEventEmitter enabled.');
        }
    }
    disable() {
        if (__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_assertOK).call(this, __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f"))) {
            __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_status, 'stopped', "f");
            __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f")?.removeListener('system', __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_systemEventListener, "f"));
            __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug('[ytcr] MPDSubsystemEventEmitter disabled.');
        }
    }
    on(event, listener) {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_addSubsystemEventListener).call(this, event, listener);
        return this;
    }
    once(event, listener) {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_addSubsystemEventListener).call(this, event, listener, true);
        return this;
    }
    off(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event];
        if (!listeners) {
            return this;
        }
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event] = listeners.filter((l) => l.callback !== listener);
        return this;
    }
    prependOnceListener(event, listener) {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_instances, "m", _MPDSubsystemEventEmitter_addSubsystemEventListener).call(this, event, listener, true, true);
        return this;
    }
    destroy() {
        if (__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_status, "f") === 'destroyed') {
            return;
        }
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_status, 'destroyed', "f");
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f")?.removeListener('system', __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_systemEventListener, "f"));
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, {}, "f");
        __classPrivateFieldSet(this, _MPDSubsystemEventEmitter_mpdClient, null, "f");
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug('[ytcr] MPDSubsystemEventEmitter destroyed.');
    }
}
exports.default = MPDSubsystemEventEmitter;
_MPDSubsystemEventEmitter_status = new WeakMap(), _MPDSubsystemEventEmitter_mpdClient = new WeakMap(), _MPDSubsystemEventEmitter_logger = new WeakMap(), _MPDSubsystemEventEmitter_systemEventListener = new WeakMap(), _MPDSubsystemEventEmitter_subsystemEventListeners = new WeakMap(), _MPDSubsystemEventEmitter_instances = new WeakSet(), _MPDSubsystemEventEmitter_assertOK = function _MPDSubsystemEventEmitter_assertOK(c) {
    if (__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_status, "f") === 'destroyed') {
        throw Error('Instance destroyed');
    }
    if (!__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_mpdClient, "f")) {
        throw Error('MPD client not set');
    }
    return true;
}, _MPDSubsystemEventEmitter_addSubsystemEventListener = function _MPDSubsystemEventEmitter_addSubsystemEventListener(event, listener, once = false, prepend = false) {
    if (!__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event]) {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event] = [];
    }
    const wrapped = {
        once,
        callback: listener
    };
    if (prepend) {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event].unshift(wrapped);
    }
    else {
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[event].push(wrapped);
    }
}, _MPDSubsystemEventEmitter_handleSystemEvent = async function _MPDSubsystemEventEmitter_handleSystemEvent(subsystem) {
    if (__classPrivateFieldGet(this, _MPDSubsystemEventEmitter_status, "f") === 'running') {
        const listeners = __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[subsystem];
        if (!listeners) {
            return;
        }
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug(`[ytcr] MPDSubsystemEventEmitter invoking ${listeners.length} SubsystemEventListener callbacks for: ${subsystem}`);
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
                __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug('[ytcr] MPDSubsystemEventEmitter handleSystemEvent error:', error);
            }
            if (!event.propagate) {
                __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_logger, "f").debug('[ytcr] SubsystemEvent.propagate: false. Event propagation stopped.');
                break;
            }
        }
        __classPrivateFieldGet(this, _MPDSubsystemEventEmitter_subsystemEventListeners, "f")[subsystem] = listeners.filter((l) => !l.once);
    }
};
//# sourceMappingURL=MPDSubsystemEventEmitter.js.map