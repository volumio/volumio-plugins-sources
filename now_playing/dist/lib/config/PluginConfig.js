"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = exports.DefaultMetadataServiceOptions = void 0;
const lodash_1 = __importDefault(require("lodash"));
const now_playing_common_1 = require("now-playing-common");
const ContentRegionSettings_1 = require("now-playing-common/dist/config/ContentRegionSettings");
const StartupOptions_1 = require("now-playing-common/dist/config/StartupOptions");
exports.DefaultMetadataServiceOptions = {
    geniusAccessToken: '',
    excludeParenthesized: false,
    parenthesisType: 'round',
    queryMusicServices: true,
    enableSyncedLyrics: true
};
exports.PLUGIN_CONFIG_SCHEMA = {
    port: { defaultValue: 4004, json: false },
    startup: { defaultValue: lodash_1.default.cloneDeep(StartupOptions_1.DefaultStartupOptions), json: true },
    metadataService: { defaultValue: lodash_1.default.cloneDeep(exports.DefaultMetadataServiceOptions), json: true },
    contentRegion: { defaultValue: lodash_1.default.cloneDeep(ContentRegionSettings_1.DefaultContentRegionSettings), json: true },
    'screen.nowPlaying': { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultNowPlayingScreenSettings), json: true },
    background: { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultBackgroundSettings), json: true },
    actionPanel: { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultActionPanelSettings), json: true },
    'screen.idle': { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultIdleScreenSettings), json: true },
    theme: { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultThemeSettings), json: true },
    performance: { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultPerformanceSettings), json: true },
    localization: { defaultValue: lodash_1.default.cloneDeep(now_playing_common_1.DefaultLocalizationSettings), json: true },
    kioskDisplay: { defaultValue: 'default', json: false },
    configVersion: { defaultValue: null, json: false }
};
//# sourceMappingURL=PluginConfig.js.map