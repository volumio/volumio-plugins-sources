"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yt_cast_receiver_1 = require("yt-cast-receiver");
const YTCRContext_1 = __importDefault(require("./YTCRContext"));
const BUNDLE_KEY = 'yt-cast-receiver';
const TTL = 3600000;
class ReceiverDataStore extends yt_cast_receiver_1.DataStore {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    set(key, value) {
        const bundle = YTCRContext_1.default.getConfigValue(BUNDLE_KEY);
        bundle[key] = value;
        YTCRContext_1.default.setConfigValue(BUNDLE_KEY, bundle);
        YTCRContext_1.default.setConfigValue('dataStoreLastModified', new Date().getTime());
        return Promise.resolve();
    }
    get(key) {
        const bundle = YTCRContext_1.default.getConfigValue(BUNDLE_KEY);
        return Promise.resolve(bundle[key] || null);
    }
    clear() {
        YTCRContext_1.default.deleteConfigValue(BUNDLE_KEY);
        YTCRContext_1.default.deleteConfigValue('dataStoreLastModified');
    }
    isExpired() {
        const lastModified = YTCRContext_1.default.getConfigValue('dataStoreLastModified');
        if (lastModified === null) {
            return false;
        }
        return new Date().getTime() - lastModified >= TTL;
    }
}
exports.default = ReceiverDataStore;
//# sourceMappingURL=ReceiverDataStore.js.map