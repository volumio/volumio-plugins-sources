"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _PairingHelper_toastFetchingTimer, _PairingHelper_toastFetching, _PairingHelper_cancelToastFetching;
Object.defineProperty(exports, "__esModule", { value: true });
const yt_cast_receiver_1 = require("yt-cast-receiver");
const YTCRContext_js_1 = __importDefault(require("./YTCRContext.js"));
class PairingHelper {
    static getManualPairingCode(receiver, logger) {
        if (receiver.status !== yt_cast_receiver_1.Constants.STATUSES.RUNNING) {
            return Promise.resolve(null);
        }
        let timeout = null;
        const service = receiver.getPairingCodeRequestService();
        const stopService = () => {
            __classPrivateFieldGet(this, _a, "m", _PairingHelper_cancelToastFetching).call(this);
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            service.stop();
            service.removeAllListeners();
        };
        if (service.status === yt_cast_receiver_1.Constants.STATUSES.RUNNING) {
            stopService();
        }
        return new Promise((resolve) => {
            service.on('request', () => {
                logger.debug('[ytcr] Obtaining manual pairing code...');
                __classPrivateFieldGet(this, _a, "m", _PairingHelper_toastFetching).call(this);
            });
            service.on('response', (code) => {
                stopService();
                logger.debug('[ytcr] Obtained manual pairing code.');
                const segments = code.match(/.{1,3}/g);
                const formatted = segments ? segments.join(' ') : code;
                resolve(formatted);
            });
            service.on('error', (error) => {
                stopService();
                logger.error('[ytcr] Failed to obtain manual pairing code:', error);
                YTCRContext_js_1.default.toast('error', YTCRContext_js_1.default.getI18n('YTCR_FETCH_TV_CODE_ERR', error.message));
                resolve(null);
            });
            service.start();
            timeout = setTimeout(() => {
                stopService();
                logger.error('[ytcr] Failed to obtain manual pairing code: timeout.');
                YTCRContext_js_1.default.toast('error', YTCRContext_js_1.default.getI18n('YTCR_FETCH_TV_CODE_ERR', 'timeout'));
                resolve(null);
            }, 10000);
        });
    }
}
exports.default = PairingHelper;
_a = PairingHelper, _PairingHelper_toastFetching = function _PairingHelper_toastFetching() {
    __classPrivateFieldGet(this, _a, "m", _PairingHelper_cancelToastFetching).call(this);
    __classPrivateFieldSet(this, _a, setTimeout(() => {
        YTCRContext_js_1.default.toast('info', YTCRContext_js_1.default.getI18n('YTCR_FETCHING_TV_CODE'));
    }, 4000), "f", _PairingHelper_toastFetchingTimer);
}, _PairingHelper_cancelToastFetching = function _PairingHelper_cancelToastFetching() {
    if (__classPrivateFieldGet(this, _a, "f", _PairingHelper_toastFetchingTimer)) {
        clearTimeout(__classPrivateFieldGet(this, _a, "f", _PairingHelper_toastFetchingTimer));
        __classPrivateFieldSet(this, _a, null, "f", _PairingHelper_toastFetchingTimer);
    }
};
_PairingHelper_toastFetchingTimer = { value: null };
//# sourceMappingURL=PairingHelper.js.map