"use strict";
/**
 * Note: this is not a general-purpose utility class, but one made specifically for
 * keeping track of the seek position in MPD 'stop' events handled by PlayController.
 */
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
var _StopWatch_instances, _StopWatch_startTimestamp, _StopWatch_stopTimestamp, _StopWatch_startElapsedMS, _StopWatch_status, _StopWatch_getCurrentTimestamp;
Object.defineProperty(exports, "__esModule", { value: true });
class StopWatch {
    constructor() {
        _StopWatch_instances.add(this);
        _StopWatch_startTimestamp.set(this, void 0);
        _StopWatch_stopTimestamp.set(this, void 0);
        _StopWatch_startElapsedMS.set(this, void 0);
        _StopWatch_status.set(this, void 0);
        __classPrivateFieldSet(this, _StopWatch_status, 'stopped', "f");
        __classPrivateFieldSet(this, _StopWatch_startTimestamp, __classPrivateFieldSet(this, _StopWatch_stopTimestamp, __classPrivateFieldGet(this, _StopWatch_instances, "m", _StopWatch_getCurrentTimestamp).call(this), "f"), "f");
    }
    start(startElapsedMS = 0) {
        __classPrivateFieldSet(this, _StopWatch_startTimestamp, __classPrivateFieldSet(this, _StopWatch_stopTimestamp, __classPrivateFieldGet(this, _StopWatch_instances, "m", _StopWatch_getCurrentTimestamp).call(this), "f"), "f");
        __classPrivateFieldSet(this, _StopWatch_startElapsedMS, startElapsedMS, "f");
        __classPrivateFieldSet(this, _StopWatch_status, 'running', "f");
        return this;
    }
    stop() {
        if (__classPrivateFieldGet(this, _StopWatch_status, "f") !== 'stopped') {
            __classPrivateFieldSet(this, _StopWatch_stopTimestamp, __classPrivateFieldGet(this, _StopWatch_instances, "m", _StopWatch_getCurrentTimestamp).call(this), "f");
            __classPrivateFieldSet(this, _StopWatch_status, 'stopped', "f");
        }
        return this;
    }
    getElapsed() {
        if (__classPrivateFieldGet(this, _StopWatch_status, "f") === 'stopped') {
            return __classPrivateFieldGet(this, _StopWatch_stopTimestamp, "f") - __classPrivateFieldGet(this, _StopWatch_startTimestamp, "f") + __classPrivateFieldGet(this, _StopWatch_startElapsedMS, "f");
        }
        // Status: 'running'
        return __classPrivateFieldGet(this, _StopWatch_instances, "m", _StopWatch_getCurrentTimestamp).call(this) - __classPrivateFieldGet(this, _StopWatch_startTimestamp, "f") + __classPrivateFieldGet(this, _StopWatch_startElapsedMS, "f");
    }
}
exports.default = StopWatch;
_StopWatch_startTimestamp = new WeakMap(), _StopWatch_stopTimestamp = new WeakMap(), _StopWatch_startElapsedMS = new WeakMap(), _StopWatch_status = new WeakMap(), _StopWatch_instances = new WeakSet(), _StopWatch_getCurrentTimestamp = function _StopWatch_getCurrentTimestamp() {
    return new Date().getTime();
};
//# sourceMappingURL=StopWatch.js.map