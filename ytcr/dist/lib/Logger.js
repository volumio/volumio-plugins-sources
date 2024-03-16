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
var _Logger_logger;
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const yt_cast_receiver_1 = require("yt-cast-receiver");
class Logger extends yt_cast_receiver_1.DefaultLogger {
    constructor(volumioLogger) {
        super();
        _Logger_logger.set(this, void 0);
        __classPrivateFieldSet(this, _Logger_logger, volumioLogger, "f");
    }
    // Override
    toOutput(targetLevel, msg) {
        const str = msg.join(os_1.EOL);
        switch (targetLevel) {
            case yt_cast_receiver_1.LOG_LEVELS.ERROR:
                __classPrivateFieldGet(this, _Logger_logger, "f").error(str);
                break;
            case yt_cast_receiver_1.LOG_LEVELS.WARN:
                __classPrivateFieldGet(this, _Logger_logger, "f").warn(str);
                break;
            case yt_cast_receiver_1.LOG_LEVELS.INFO:
                __classPrivateFieldGet(this, _Logger_logger, "f").info(str);
                break;
            case yt_cast_receiver_1.LOG_LEVELS.DEBUG:
                __classPrivateFieldGet(this, _Logger_logger, "f").verbose(str);
                break;
            default:
        }
    }
}
exports.default = Logger;
_Logger_logger = new WeakMap();
//# sourceMappingURL=Logger.js.map