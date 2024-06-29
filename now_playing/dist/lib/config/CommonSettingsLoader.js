"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _CommonSettingsLoader_getLocalizationSettings;
Object.defineProperty(exports, "__esModule", { value: true });
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const ConfigHelper_1 = __importDefault(require("./ConfigHelper"));
const now_playing_common_1 = require("now-playing-common");
class CommonSettingsLoader {
    static get(category) {
        if (category === now_playing_common_1.CommonSettingsCategory.Localization) {
            return __classPrivateFieldGet(this, _a, "m", _CommonSettingsLoader_getLocalizationSettings).call(this);
        }
        return NowPlayingContext_1.default.getConfigValue(category);
    }
}
exports.default = CommonSettingsLoader;
_a = CommonSettingsLoader, _CommonSettingsLoader_getLocalizationSettings = function _CommonSettingsLoader_getLocalizationSettings() {
    const localization = NowPlayingContext_1.default.getConfigValue(now_playing_common_1.CommonSettingsCategory.Localization);
    switch (localization.locale) {
        case 'matchVolumio':
            localization.resolvedLocale = ConfigHelper_1.default.getVolumioLocale();
            break;
        case 'matchClient':
        case 'localeListDivider':
            localization.resolvedLocale = null;
            break;
        default:
            localization.resolvedLocale = localization.locale;
    }
    switch (localization.timezone) {
        case 'matchClient':
        case 'timezoneListDivider':
            localization.resolvedTimezone = null;
            break;
        case 'matchGeoCoordinates':
            localization.resolvedTimezone = localization.geoTimezone || null;
            break;
        default:
            localization.resolvedTimezone = localization.timezone;
    }
    return localization;
};
//# sourceMappingURL=CommonSettingsLoader.js.map