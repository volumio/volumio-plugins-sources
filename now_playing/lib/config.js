const semver = require('semver');
const locales = require('windows-locale');
const ct = require('countries-and-timezones');
const { getPluginVersion } = require("./util");
const np = require(nowPlayingPluginLibRoot + '/np');

const DEFAULT_LOCALIZATION_SETTINGS = {
    geoCoordinates: '',
    locale: 'matchVolumio',
    timezone: 'matchClient',
    unitSystem: 'metric'
};

const DEFAULT_PERFORMANCE_SETTINGS = {
    transitionEffectsKiosk: false,
    transitionEffectsOtherDevices: true,
    unmountScreensOnExit: 'default'
};

function checkConfig() {
    const pluginVersion = getPluginVersion();
    const configVersion = np.getConfigValue('configVersion', null);

    if (!configVersion) {
        np.getLogger().info(`[now-playing-config] Config version not available. Either this is the first time the plugin is installed and run or the previous version is < 0.3.0). Config data will not be updated.`);
        updateConfigVersion(pluginVersion);
    }
    else if (semver.satisfies(pluginVersion, configVersion)) {
        np.getLogger().info(`[now-playing-config] Config is up to date.`);
    }
    else if (semver.gt(configVersion, pluginVersion)) {
        np.getLogger().info(`[now-playing-config] Config version is newer than plugin version (${configVersion} > ${pluginVersion}). Config data will not be updated.`);
        updateConfigVersion(pluginVersion);
    }
    else if (semver.lt(configVersion, pluginVersion)) {
        np.getLogger().info(`[now-playing-config] Config version is older than plugin version (${configVersion} < ${pluginVersion}). Config data will be updated.`);
        updateConfigData(configVersion, pluginVersion);
    }
}

function updateConfigData(fromVersion, toVersion) {
    // Not actually doing anything for this version as it is the first version that supports config data updates.
    // Future versions will contain logic to update config data as necessary.
}

function updateConfigVersion(toVersion) {
    np.setConfigValue('configVersion', toVersion);
    np.getLogger().info(`[now-playing-config] Updated config version to ${toVersion}`);
}

function getVolumioLocale() {
    return np.getLanguageCode().replace('_', '-');
}

function getLocaleList() {
    let localeList = np.get('localeList');
    let matchVolumioLabel = np.getI18n('NOW_PLAYING_LOCALE_VOLUMIO', getVolumioLocale());
    if (!localeList) {
        localeList = [
            {
                value: 'matchVolumio',
                label: matchVolumioLabel
            },
            {
                value: 'matchClient',
                label: np.getI18n('NOW_PLAYING_LOCALE_CLIENT')
            },
            {
                value: 'localeListDivider',
                label: '----------------------------------------'
            }
        ];
        for (const lc of Object.values(locales)) {
            localeList.push({
                value: lc.tag,
                label: lc.language + (lc.location ? ` (${lc.location})` : '') + ` - ${lc.tag}`
            });
        }
        np.set('localeList', localeList);
    }
    else {
        localeList[0].label = matchVolumioLabel;
    }
    return localeList;
}

function getTimezoneList() {
    let timezoneList = np.get('timezoneList');
    if (!timezoneList) {
        timezoneList = [
            {
                value: 'matchClient',
                label: np.getI18n('NOW_PLAYING_TIMEZONE_CLIENT')
            },
            {
                value: 'matchGeoCoordinates',
                label: np.getI18n('NOW_PLAYING_TIMEZONE_GEO_COORD')
            },
            {
                value: 'timezoneListDivider',
                label: '----------------------------------------'
            }
        ];
        for (const tz of Object.values(ct.getAllTimezones())) {
            timezoneList.push({
                value: tz.name,
                label: tz.name + ` (GMT${tz.utcOffsetStr})`
            });
        }
        np.set('timezoneList', timezoneList);
    }
    return timezoneList;
}

function getLocalizationSettings() {
    let _settings = np.getConfigValue('localization', {}, true);
    let localization = {
        geoCoordinates: _settings.geoCoordinates || DEFAULT_LOCALIZATION_SETTINGS.geoCoordinates,
        locale: _settings.locale || DEFAULT_LOCALIZATION_SETTINGS.locale,
        timezone: _settings.timezone || DEFAULT_LOCALIZATION_SETTINGS.timezone,
        unitSystem: _settings.unitSystem || DEFAULT_LOCALIZATION_SETTINGS.unitSystem
    };

    switch (localization.locale) {
        case 'matchVolumio':
            localization.resolvedLocale = getVolumioLocale();
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
            localization.resolvedTimezone = _settings.geoTimezone || null;
            break;
        default:
            localization.resolvedTimezone = localization.timezone;
    }

    return localization;
}

function getPerformanceSettings() {
    let _settings = np.getConfigValue('performance', {}, true);
    return {...DEFAULT_PERFORMANCE_SETTINGS, ..._settings};
}

function parseCoordinates(str) {
    if (!str) {
        return null;
    }
    let parts = str.split(',');
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null;
    }
    return {
        lat: parseFloat(parts[0]),
        lon: parseFloat(parts[1])
    };
}

module.exports = {
    checkConfig,
    getLocaleList,
    getTimezoneList,
    getLocalizationSettings,
    getPerformanceSettings,
    parseCoordinates
};
