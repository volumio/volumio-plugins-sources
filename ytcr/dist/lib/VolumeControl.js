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
var _VolumeControl_commandRouter, _VolumeControl_logger, _VolumeControl_currentVolume, _VolumeControl_volumioVolumeChangeListener;
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_js_1 = require("./Utils.js");
class VolumeControl {
    constructor(commandRouter, logger) {
        _VolumeControl_commandRouter.set(this, void 0);
        _VolumeControl_logger.set(this, void 0);
        _VolumeControl_currentVolume.set(this, void 0);
        _VolumeControl_volumioVolumeChangeListener.set(this, void 0);
        __classPrivateFieldSet(this, _VolumeControl_commandRouter, commandRouter, "f");
        __classPrivateFieldSet(this, _VolumeControl_logger, logger, "f");
        __classPrivateFieldSet(this, _VolumeControl_currentVolume, null, "f");
        __classPrivateFieldSet(this, _VolumeControl_volumioVolumeChangeListener, null, "f");
    }
    async init() {
        __classPrivateFieldSet(this, _VolumeControl_currentVolume, await this.getVolume(), "f");
        __classPrivateFieldGet(this, _VolumeControl_logger, "f").debug('[ytcr] VolumeControl initialized with current volume:', __classPrivateFieldGet(this, _VolumeControl_currentVolume, "f"));
    }
    async setVolume(volume, setInternalOnly = false) {
        const oldVolume = __classPrivateFieldGet(this, _VolumeControl_currentVolume, "f");
        __classPrivateFieldSet(this, _VolumeControl_currentVolume, volume, "f");
        if (!setInternalOnly) {
            try {
                if (oldVolume?.level !== volume.level) {
                    __classPrivateFieldGet(this, _VolumeControl_logger, "f").debug(`[ytcr] VolumeControl setting Volumio's volume level to: ${volume.level}`);
                    __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").volumiosetvolume(volume.level);
                }
                if (oldVolume?.muted !== volume.muted) {
                    __classPrivateFieldGet(this, _VolumeControl_logger, "f").debug(`[ytcr] VolumeControl setting Volumio's mute status to: ${volume.muted}`);
                    __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").volumiosetvolume(volume.muted ? 'mute' : 'unmute');
                }
            }
            catch (error) {
                __classPrivateFieldGet(this, _VolumeControl_logger, "f").error('[ytcr] Failed to set Volumio\'s volume:', error);
                __classPrivateFieldSet(this, _VolumeControl_currentVolume, null, "f");
            }
        }
    }
    async getVolume() {
        if (__classPrivateFieldGet(this, _VolumeControl_currentVolume, "f") === null) {
            try {
                const volumioVolume = await (0, Utils_js_1.kewToJSPromise)(__classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").volumioretrievevolume());
                __classPrivateFieldSet(this, _VolumeControl_currentVolume, {
                    level: volumioVolume.vol,
                    muted: volumioVolume.mute
                }, "f");
            }
            catch (error) {
                __classPrivateFieldGet(this, _VolumeControl_logger, "f").error('[ytcr] VolumeControl failed to obtain volume from Volumio:', error);
                __classPrivateFieldSet(this, _VolumeControl_currentVolume, null, "f");
                return {
                    level: 0,
                    muted: false
                };
            }
        }
        return __classPrivateFieldGet(this, _VolumeControl_currentVolume, "f");
    }
    registerVolumioVolumeChangeListener(listener) {
        if (__classPrivateFieldGet(this, _VolumeControl_volumioVolumeChangeListener, "f")) {
            this.unregisterVolumioVolumeChangeListener();
        }
        __classPrivateFieldSet(this, _VolumeControl_volumioVolumeChangeListener, listener, "f");
        __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").addCallback('volumioupdatevolume', listener);
    }
    unregisterVolumioVolumeChangeListener() {
        if (!__classPrivateFieldGet(this, _VolumeControl_volumioVolumeChangeListener, "f")) {
            return;
        }
        const callbacks = __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").callbacks['volumioupdatevolume'];
        if (callbacks) {
            const oldCount = callbacks.length;
            __classPrivateFieldGet(this, _VolumeControl_logger, "f").debug(`[ytcr] VolumeControl removing Volumio callbacks for 'volumioupdatevolume'. Current count: ${oldCount}`);
            __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").callbacks['volumioupdatevolume'] = callbacks.filter((l) => l !== __classPrivateFieldGet(this, _VolumeControl_volumioVolumeChangeListener, "f"));
            const newCount = __classPrivateFieldGet(this, _VolumeControl_commandRouter, "f").callbacks['volumioupdatevolume'].length;
            __classPrivateFieldGet(this, _VolumeControl_logger, "f").debug(`[ytcr] VolumeControl removed ${oldCount - newCount} Volumio callbacks for 'volumioupdatevolume'.`);
        }
    }
}
exports.default = VolumeControl;
_VolumeControl_commandRouter = new WeakMap(), _VolumeControl_logger = new WeakMap(), _VolumeControl_currentVolume = new WeakMap(), _VolumeControl_volumioVolumeChangeListener = new WeakMap();
//# sourceMappingURL=VolumeControl.js.map