"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
const now_playing_common_1 = require("now-playing-common");
exports.PLUGIN_CONFIG_SCHEMA = {
    port: { defaultValue: 4004, json: false },
    geniusAccessToken: { defaultValue: '', json: false },
    'screen.nowPlaying': { defaultValue: now_playing_common_1.DefaultNowPlayingScreenSettings, json: true },
    background: { defaultValue: now_playing_common_1.DefaultBackgroundSettings, json: true },
    actionPanel: { defaultValue: now_playing_common_1.DefaultActionPanelSettings, json: true },
    'screen.idle': { defaultValue: now_playing_common_1.DefaultIdleScreenSettings, json: true },
    theme: { defaultValue: now_playing_common_1.DefaultThemeSettings, json: true },
    performance: { defaultValue: now_playing_common_1.DefaultPerformanceSettings, json: true },
    localization: { defaultValue: now_playing_common_1.DefaultLocalizationSettings, json: true },
    kioskDisplay: { defaultValue: 'default', json: false },
    configVersion: { defaultValue: null, json: false }
};
//# sourceMappingURL=PluginConfig.js.map