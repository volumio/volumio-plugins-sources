"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const now_playing_common_1 = require("now-playing-common");
const NowPlayingContext_1 = __importDefault(require("../../NowPlayingContext"));
/**
 * Update:
 * - `theme`: from string to { active: string; }
 */
const TO_VERSION = '0.4.0';
function update() {
    updateThemeSetting();
    NowPlayingContext_1.default.getLogger().info(`[now-playing] Updating config version to ${TO_VERSION}`);
    NowPlayingContext_1.default.setConfigValue('configVersion', TO_VERSION);
    NowPlayingContext_1.default.getLogger().info('[now-playing] Update complete');
}
exports.update = update;
function updateThemeSetting() {
    /**
     * Old version has 'theme' value of string type, current is object { active: themeName }.
     * Here, we test whether theme value is string type and, if so, convert and save it as object.
     * Because np.getConfigValue() will return default value if JSON parse fails,
     * we need to test parsing the raw config value ourselves.
     */
    const rawValue = NowPlayingContext_1.default.getConfigValue('theme', true);
    let tryParsedValue;
    try {
        tryParsedValue = JSON.parse(rawValue);
    }
    catch (error) {
        tryParsedValue = rawValue;
    }
    if (tryParsedValue === undefined ||
        (typeof tryParsedValue === 'object' && Reflect.has(tryParsedValue, 'active'))) {
        return;
    }
    let updateValue = null;
    if (typeof tryParsedValue === 'string') {
        updateValue = {
            active: tryParsedValue
        };
    }
    else {
        // `rawValue` is unknown type or object, set default value
        updateValue = { ...now_playing_common_1.DefaultThemeSettings };
    }
    if (updateValue) {
        NowPlayingContext_1.default.setConfigValue('theme', updateValue);
        NowPlayingContext_1.default.getLogger().info(`[now-playing] Updated config value for 'theme': ${JSON.stringify(updateValue)}`);
    }
}
//# sourceMappingURL=config_from_0_3_8.js.map