"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yt_cast_receiver_1 = require("yt-cast-receiver");
const YTCRContext_js_1 = __importDefault(require("./YTCRContext.js"));
const BUNDLE_KEY = 'yt-cast-receiver';
class ReceiverDataStore extends yt_cast_receiver_1.DataStore {
    async set(key, value) {
        const bundle = YTCRContext_js_1.default.getConfigValue(BUNDLE_KEY, {}, true);
        bundle[key] = value;
        YTCRContext_js_1.default.setConfigValue(BUNDLE_KEY, bundle, true);
    }
    async get(key) {
        const bundle = YTCRContext_js_1.default.getConfigValue(BUNDLE_KEY, {}, true);
        return bundle[key] || null;
    }
    clear() {
        YTCRContext_js_1.default.deleteConfigValue(BUNDLE_KEY);
    }
}
exports.default = ReceiverDataStore;
//# sourceMappingURL=ReceiverDataStore.js.map