"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const windows_locale_1 = __importDefault(require("windows-locale"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
class ConfigHelper {
    static parseCoordinates(str) {
        if (!str) {
            return null;
        }
        const parts = str.split(',');
        if (parts[0] !== undefined && parts[1] !== undefined) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon)) {
                return { lat, lon };
            }
        }
        return null;
    }
    static getVolumioLocale() {
        return NowPlayingContext_1.default.getLanguageCode().replace('_', '-');
    }
    static getLocaleList() {
        let localeList = NowPlayingContext_1.default.get('localeList');
        const matchVolumioLabel = NowPlayingContext_1.default.getI18n('NOW_PLAYING_LOCALE_VOLUMIO', this.getVolumioLocale());
        if (!localeList) {
            localeList = [
                {
                    value: 'matchVolumio',
                    label: matchVolumioLabel
                },
                {
                    value: 'matchClient',
                    label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_LOCALE_CLIENT')
                },
                {
                    value: 'localeListDivider',
                    label: '----------------------------------------'
                }
            ];
            for (const lc of Object.values(windows_locale_1.default)) {
                localeList.push({
                    value: lc.tag,
                    label: `${lc.language + (lc.location ? ` (${lc.location})` : '')} - ${lc.tag}`
                });
            }
            NowPlayingContext_1.default.set('localeList', localeList);
        }
        else {
            localeList[0].label = matchVolumioLabel;
        }
        return localeList;
    }
    static async getTimezoneList() {
        let timezoneList = NowPlayingContext_1.default.get('timezoneList');
        if (!timezoneList) {
            timezoneList = [
                {
                    value: 'matchClient',
                    label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_TIMEZONE_CLIENT')
                },
                {
                    value: 'matchGeoCoordinates',
                    label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_TIMEZONE_GEO_COORD')
                },
                {
                    value: 'timezoneListDivider',
                    label: '----------------------------------------'
                }
            ];
            const ct = await import('countries-and-timezones');
            for (const tz of Object.values(ct.getAllTimezones())) {
                timezoneList.push({
                    value: tz.name,
                    label: `${tz.name} (GMT${tz.utcOffsetStr})`
                });
            }
            NowPlayingContext_1.default.set('timezoneList', timezoneList);
        }
        return timezoneList;
    }
}
exports.default = ConfigHelper;
//# sourceMappingURL=ConfigHelper.js.map