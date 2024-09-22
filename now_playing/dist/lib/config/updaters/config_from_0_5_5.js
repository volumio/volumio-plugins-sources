"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const PluginConfig_1 = require("../PluginConfig");
const NowPlayingContext_1 = __importDefault(require("../../NowPlayingContext"));
/**
 * Update:
 * - `theme`: from string to { active: string; }
 */
const TO_VERSION = '0.5.6';
function update() {
    updateMetadataServiceOptions();
    NowPlayingContext_1.default.getLogger().info(`[now-playing] Updating config version to ${TO_VERSION}`);
    NowPlayingContext_1.default.setConfigValue('configVersion', TO_VERSION);
    NowPlayingContext_1.default.getLogger().info('[now-playing] Update complete');
}
exports.update = update;
function updateMetadataServiceOptions() {
    /**
     * Old version has 'geniusAccessToken' value of string type, current is held in
     * object of type MetadataServiceOptions{ geniusAccessToken: string; ... }.
     * Here, we test whether geniusAccessToken value exists as a standalone setting and, if so,
     * place it in an object of type MetadataServiceOptions, followed by saving said object.
     */
    const rawValue = NowPlayingContext_1.default.getConfigValue('geniusAccessToken', true);
    let updateValue;
    if (typeof rawValue === 'string') {
        updateValue = {
            ...PluginConfig_1.DefaultMetadataServiceOptions,
            'geniusAccessToken': rawValue
        };
    }
    else {
        updateValue = { ...PluginConfig_1.DefaultMetadataServiceOptions };
    }
    NowPlayingContext_1.default.setConfigValue('metadataService', updateValue);
    NowPlayingContext_1.default.deleteConfigValue('geniusAccessToken');
    NowPlayingContext_1.default.getLogger().info('[now-playing] Updated config value for \'metadataService\'');
}
//# sourceMappingURL=config_from_0_5_5.js.map