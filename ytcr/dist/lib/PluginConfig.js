"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
const yt_cast_receiver_1 = require("yt-cast-receiver");
exports.PLUGIN_CONFIG_SCHEMA = {
    port: { defaultValue: 8098, json: false },
    bindToIf: { defaultValue: '', json: false },
    region: { defaultValue: 'US', json: false },
    language: { defaultValue: 'en', json: false },
    enableAutoplayOnConnect: { defaultValue: true, json: false },
    resetPlayerOnDisconnect: { defaultValue: yt_cast_receiver_1.Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED, json: false },
    prefetch: { defaultValue: true, json: false },
    preferOpus: { defaultValue: false, json: false },
    liveStreamQuality: { defaultValue: 'auto', json: false },
    'yt-cast-receiver': { defaultValue: {}, json: true },
    dataStoreLastModified: { defaultValue: null, json: false },
    debug: { defaultValue: false, json: false }
};
//# sourceMappingURL=PluginConfig.js.map