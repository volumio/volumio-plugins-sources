"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ControllerNowPlaying_instances, _ControllerNowPlaying_context, _ControllerNowPlaying_config, _ControllerNowPlaying_commandRouter, _ControllerNowPlaying_volumioLanguageChangeCallback, _ControllerNowPlaying_doGetUIConfig, _ControllerNowPlaying_parseConfigSaveData, _ControllerNowPlaying_configSaveDockedComponentSettings, _ControllerNowPlaying_configureWeatherApi, _ControllerNowPlaying_broadcastPluginInfo, _ControllerNowPlaying_notifyCommonSettingsUpdated, _ControllerNowPlaying_doOnStart, _ControllerNowPlaying_doOnStop, _ControllerNowPlaying_startApp, _ControllerNowPlaying_stopApp, _ControllerNowPlaying_restartApp, _ControllerNowPlaying_onVolumioLanguageChanged;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const geo_tz_1 = __importDefault(require("geo-tz"));
const NowPlayingContext_1 = __importDefault(require("./lib/NowPlayingContext"));
const Misc_1 = require("./lib/utils/Misc");
const App = __importStar(require("./app"));
const CommonSettingsLoader_1 = __importDefault(require("./lib/config/CommonSettingsLoader"));
const ConfigHelper_1 = __importDefault(require("./lib/config/ConfigHelper"));
const SystemUtils = __importStar(require("./lib/utils/System"));
const KioskUtils = __importStar(require("./lib/utils/Kiosk"));
const ConfigUpdater_1 = __importDefault(require("./lib/config/ConfigUpdater"));
const MetadataAPI_1 = __importDefault(require("./lib/api/MetadataAPI"));
const WeatherAPI_1 = __importDefault(require("./lib/api/WeatherAPI"));
const now_playing_common_1 = require("now-playing-common");
const UIConfigHelper_1 = __importDefault(require("./lib/config/UIConfigHelper"));
const ConfigBackupHelper_1 = __importDefault(require("./lib/config/ConfigBackupHelper"));
const MyBackgroundMonitor_1 = __importDefault(require("./lib/utils/MyBackgroundMonitor"));
const FontHelper_1 = __importDefault(require("./lib/utils/FontHelper"));
class ControllerNowPlaying {
    constructor(context) {
        _ControllerNowPlaying_instances.add(this);
        _ControllerNowPlaying_context.set(this, void 0);
        _ControllerNowPlaying_config.set(this, void 0);
        _ControllerNowPlaying_commandRouter.set(this, void 0);
        _ControllerNowPlaying_volumioLanguageChangeCallback.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerNowPlaying_context, context, "f");
        __classPrivateFieldSet(this, _ControllerNowPlaying_commandRouter, __classPrivateFieldGet(this, _ControllerNowPlaying_context, "f").coreCommand, "f");
        __classPrivateFieldSet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, null, "f");
    }
    getUIConfig() {
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_doGetUIConfig).call(this))
            .fail((error) => {
            NowPlayingContext_1.default.getLogger().error(`[now-playing] getUIConfig(): Cannot populate configuration - ${error}`);
            throw error;
        });
    }
    configureVolumioKiosk(data) {
        KioskUtils.configureVolumioKiosk(data.display).finally(() => {
            NowPlayingContext_1.default.refreshUIConfig();
        });
    }
    restoreVolumioKioskBak() {
        KioskUtils.restoreVolumioKiosk().finally(() => {
            NowPlayingContext_1.default.refreshUIConfig();
        });
    }
    configSaveDaemon(data) {
        const oldPort = NowPlayingContext_1.default.getConfigValue('port');
        const port = parseInt(data['port'], 10);
        if (port < 1024 || port > 65353) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_INVALID_PORT'));
            return;
        }
        if (oldPort !== port) {
            const modalData = {
                title: NowPlayingContext_1.default.getI18n('NOW_PLAYING_CONFIGURATION'),
                message: NowPlayingContext_1.default.getI18n('NOW_PLAYING_CONF_RESTART_CONFIRM'),
                size: 'lg',
                buttons: [
                    {
                        name: NowPlayingContext_1.default.getI18n('NOW_PLAYING_NO'),
                        class: 'btn btn-warning'
                    },
                    {
                        name: NowPlayingContext_1.default.getI18n('NOW_PLAYING_YES'),
                        class: 'btn btn-info',
                        emit: 'callMethod',
                        payload: {
                            'endpoint': 'user_interface/now_playing',
                            'method': 'configConfirmSaveDaemon',
                            'data': { port, oldPort }
                        }
                    }
                ]
            };
            NowPlayingContext_1.default.broadcastMessage('openModal', modalData);
        }
        else {
            NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        }
    }
    configConfirmSaveDaemon(data) {
        // Obtain kiosk info before saving new port
        const kiosk = KioskUtils.checkVolumioKiosk();
        NowPlayingContext_1.default.setConfigValue('port', data.port);
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_restartApp).call(this).then(() => {
            NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_RESTARTED'));
            // Update cached plugin info and broadcast it
            NowPlayingContext_1.default.delete('pluginInfo');
            __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_broadcastPluginInfo).call(this);
            /**
             * Check if kiosk script was set to show Now Playing, and update
             * to new port (do not restart volumio-kiosk service because
             * the screen will reload itself when app is started).
             */
            if (kiosk.exists && kiosk.display == 'nowPlaying') {
                KioskUtils.modifyVolumioKioskScript(data.oldPort, data.port, false);
            }
            NowPlayingContext_1.default.refreshUIConfig();
        })
            .catch(() => {
            NowPlayingContext_1.default.setConfigValue('port', data['oldPort']);
            NowPlayingContext_1.default.refreshUIConfig();
        });
    }
    configSaveStartupOptions(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        NowPlayingContext_1.default.setConfigValue('startup', apply);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        /**
         * Note here we don't broadcast 'settings updated' message, because
         * startup options are applied only once during app startup.
         */
    }
    configSaveLayouts(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        const screen = NowPlayingContext_1.default.getConfigValue('screen.nowPlaying');
        const infoViewLayout = screen.infoViewLayout || {};
        infoViewLayout.type = apply.npInfoViewLayoutType;
        infoViewLayout.layout = apply.npInfoViewLayout;
        infoViewLayout.preferBiggerAlbumArt = apply.npInfoViewLayoutPreferBiggerAlbumArt;
        screen.infoViewLayout = infoViewLayout;
        NowPlayingContext_1.default.setConfigValue('screen.nowPlaying', screen);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
    }
    configSaveContentRegionSettings(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        const current = NowPlayingContext_1.default.getConfigValue('contentRegion');
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('contentRegion', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.ContentRegion);
    }
    configSaveTextStyles(data) {
        const maxTitleLines = data.maxTitleLines !== '' ? parseInt(data.maxTitleLines, 10) : '';
        const maxArtistLines = data.maxArtistLines !== '' ? parseInt(data.maxArtistLines, 10) : '';
        const maxAlbumLines = data.maxAlbumLines !== '' ? parseInt(data.maxAlbumLines, 10) : '';
        const trackInfoTitleOrder = data.trackInfoTitleOrder !== '' ? parseInt(data.trackInfoTitleOrder, 10) : '';
        const trackInfoArtistOrder = data.trackInfoArtistOrder !== '' ? parseInt(data.trackInfoArtistOrder, 10) : '';
        const trackInfoAlbumOrder = data.trackInfoAlbumOrder !== '' ? parseInt(data.trackInfoAlbumOrder, 10) : '';
        const trackInfoMediaInfoOrder = data.trackInfoMediaInfoOrder !== '' ? parseInt(data.trackInfoMediaInfoOrder, 10) : '';
        const apply = {
            trackInfoVisibility: data.trackInfoVisibility.value,
            titleVisibility: data.titleVisibility,
            artistVisibility: data.artistVisibility,
            albumVisibility: data.albumVisibility,
            mediaInfoVisibility: data.mediaInfoVisibility,
            fontStyles: data.fontStyles.value,
            titleFontStyle: data.titleFontStyle.value,
            artistFontStyle: data.artistFontStyle.value,
            albumFontStyle: data.albumFontStyle.value,
            mediaInfoFontStyle: data.mediaInfoFontStyle.value,
            seekTimeFontStyle: data.seekTimeFontStyle.value,
            metadataFontStyle: data.metadataFontStyle.value,
            fontSizes: data.fontSizes.value,
            titleFontSize: data.titleFontSize,
            artistFontSize: data.artistFontSize,
            albumFontSize: data.albumFontSize,
            mediaInfoFontSize: data.mediaInfoFontSize,
            seekTimeFontSize: data.seekTimeFontSize,
            metadataFontSize: data.metadataFontSize,
            syncedLyricsCurrentLineFontSize: data.syncedLyricsCurrentLineFontSize,
            fontColors: data.fontColors.value,
            titleFontColor: data.titleFontColor,
            artistFontColor: data.artistFontColor,
            albumFontColor: data.albumFontColor,
            mediaInfoFontColor: data.mediaInfoFontColor,
            seekTimeFontColor: data.seekTimeFontColor,
            metadataFontColor: data.metadataFontColor,
            syncedLyricsColor: data.syncedLyricsColor,
            syncedLyricsCurrentLineColor: data.syncedLyricsCurrentLineColor,
            textAlignmentH: data.textAlignmentH.value,
            textAlignmentV: data.textAlignmentV.value,
            textAlignmentLyrics: data.textAlignmentLyrics.value,
            textMargins: data.textMargins.value,
            titleMargin: data.titleMargin,
            artistMargin: data.artistMargin,
            albumMargin: data.albumMargin,
            mediaInfoMargin: data.mediaInfoMargin,
            maxLines: data.maxLines.value,
            maxTitleLines,
            maxArtistLines,
            maxAlbumLines,
            trackInfoOrder: data.trackInfoOrder.value,
            trackInfoTitleOrder,
            trackInfoArtistOrder,
            trackInfoAlbumOrder,
            trackInfoMediaInfoOrder,
            trackInfoMarqueeTitle: data.trackInfoMarqueeTitle
        };
        const current = NowPlayingContext_1.default.getConfigValue('screen.nowPlaying');
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('screen.nowPlaying', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
    }
    configSaveWidgetStyles(data) {
        const apply = {
            widgetColors: data.widgetColors.value,
            widgetPrimaryColor: data.widgetPrimaryColor,
            widgetHighlightColor: data.widgetHighlightColor,
            widgetVisibility: data.widgetVisibility.value,
            playbackButtonsVisibility: data.playbackButtonsVisibility,
            seekbarVisibility: data.seekbarVisibility,
            playbackButtonSizeType: data.playbackButtonSizeType.value,
            playbackButtonSize: data.playbackButtonSize,
            seekbarStyling: data.seekbarStyling.value,
            seekbarThickness: data.seekbarThickness,
            seekbarBorderRadius: data.seekbarBorderRadius,
            seekbarShowThumb: data.seekbarShowThumb,
            seekbarThumbSize: data.seekbarThumbSize,
            widgetMargins: data.widgetMargins.value,
            playbackButtonsMargin: data.playbackButtonsMargin,
            seekbarMargin: data.seekbarMargin
        };
        const current = NowPlayingContext_1.default.getConfigValue('screen.nowPlaying');
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('screen.nowPlaying', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
    }
    configSaveAlbumartStyles(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        const current = NowPlayingContext_1.default.getConfigValue('screen.nowPlaying');
        const normalizedCurrent = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
        const refresh = normalizedCurrent.albumartVisibility !== apply.albumartVisibility;
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('screen.nowPlaying', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
        if (refresh) {
            NowPlayingContext_1.default.refreshUIConfig();
        }
    }
    configSaveBackgroundStyles(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        if (apply.myBackgroundImage === '/RANDOM/') {
            apply.myBackgroundImageType = 'random';
            apply.myBackgroundImage = '';
        }
        else {
            apply.myBackgroundImageType = 'fixed';
        }
        apply.myBackgroundRandomRefreshInterval = apply.myBackgroundRandomRefreshInterval ? parseInt(apply.myBackgroundRandomRefreshInterval, 10) : 0;
        if (apply.myBackgroundImage === '/SEPARATOR/') {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_INVALID_BACKGROUND'));
            return;
        }
        const current = NowPlayingContext_1.default.getConfigValue('background');
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('background', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.Background);
    }
    configSaveActionPanelSettings(data) {
        const settings = {
            showVolumeSlider: data.showVolumeSlider
        };
        const current = NowPlayingContext_1.default.getConfigValue('actionPanel');
        const updated = Object.assign(current, settings);
        NowPlayingContext_1.default.setConfigValue('actionPanel', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.ActionPanel);
    }
    configSaveDockedMenuSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedMenu');
    }
    configSaveDockedActionPanelTriggerSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedActionPanelTrigger');
    }
    configSaveDockedVolumeIndicatorSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedVolumeIndicator');
    }
    configSaveDockedClockSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedClock');
    }
    configSaveDockedWeatherSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedWeather');
    }
    configSaveDockedMediaFormatSettings(data) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configSaveDockedComponentSettings).call(this, data, 'dockedMediaFormat');
    }
    configSaveLocalizationSettings(data) {
        const settings = {
            geoCoordinates: data.geoCoordinates,
            locale: data.locale.value,
            timezone: data.timezone.value,
            unitSystem: data.unitSystem.value
        };
        if (settings.locale === 'localeListDivider') {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_LOCALE_SELECTION_INVALID'));
            return;
        }
        if (settings.timezone === 'timezoneListDivider') {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_TIMEZONE_SELECTION_INVALID'));
            return;
        }
        let successMessage = NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED');
        if (settings.timezone === 'matchGeoCoordinates') {
            const coord = ConfigHelper_1.default.parseCoordinates(settings.geoCoordinates || '');
            if (!coord) {
                NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_INVALID_GEO_COORD'));
                return;
            }
            const matchTimezones = geo_tz_1.default.find(coord.lat, coord.lon);
            if (Array.isArray(matchTimezones) && matchTimezones.length > 0) {
                settings.geoTimezone = matchTimezones[0];
                successMessage = NowPlayingContext_1.default.getI18n('NOW_PLAYING_TZ_SET_BY_GEO_COORD', matchTimezones[0]);
            }
            else {
                settings.geoTimezone = null;
                successMessage = null;
                NowPlayingContext_1.default.toast('warning', NowPlayingContext_1.default.getI18n('NOW_PLAYING_TZ_BY_GEO_COORD_NOT_FOUND'));
            }
        }
        NowPlayingContext_1.default.setConfigValue('localization', settings);
        if (successMessage) {
            NowPlayingContext_1.default.toast('success', successMessage);
        }
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configureWeatherApi).call(this);
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.Localization);
    }
    configSaveMetadataServiceSettings(data) {
        const token = data['geniusAccessToken'].trim();
        const settings = {
            geniusAccessToken: token,
            excludeParenthesized: data['excludeParenthesized'],
            parenthesisType: data['parenthesisType'].value,
            queryMusicServices: data['queryMusicServices'],
            enableSyncedLyrics: data['enableSyncedLyrics']
        };
        NowPlayingContext_1.default.setConfigValue('metadataService', settings);
        MetadataAPI_1.default.updateSettings(settings);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
    }
    configSaveIdleScreenSettings(data) {
        const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
        if (apply.waitTime) {
            apply.waitTime = parseInt(apply.waitTime, 10);
        }
        if (apply.myBackgroundImage === '/RANDOM/') {
            apply.myBackgroundImageType = 'random';
            apply.myBackgroundImage = '';
        }
        else {
            apply.myBackgroundImageType = 'fixed';
        }
        apply.myBackgroundRandomRefreshInterval = apply.myBackgroundRandomRefreshInterval ? parseInt(apply.myBackgroundRandomRefreshInterval, 10) : 10;
        apply.unsplashRefreshInterval = data.unsplashRefreshInterval ? parseInt(apply.unsplashRefreshInterval, 10) : 10;
        if (apply.waitTime < 10) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_IDLE_SCREEN_WAIT_TIME'));
            return;
        }
        if (apply.myBackgroundImage === '/SEPARATOR/') {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_INVALID_BACKGROUND'));
            return;
        }
        if (apply.unsplashRefreshInterval !== 0 && apply.unsplashRefreshInterval < 10) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_UNSPLASH_REFRESH_INTERVAL'));
            return;
        }
        apply.mainAlignmentCycleInterval = data.mainAlignmentCycleInterval ? parseInt(apply.mainAlignmentCycleInterval, 10) : 60;
        if (apply.mainAlignmentCycleInterval !== 0 && apply.mainAlignmentCycleInterval < 10) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_CYCLE_INTERVAL'));
            return;
        }
        const current = NowPlayingContext_1.default.getConfigValue('screen.idle');
        const normalizedCurrent = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.IdleScreen);
        const refresh = (normalizedCurrent.enabled !== 'disabled' && apply.enabled === 'disabled') ||
            (normalizedCurrent.enabled === 'disabled' && apply.enabled !== 'disabled');
        const updated = Object.assign(current, apply);
        NowPlayingContext_1.default.setConfigValue('screen.idle', updated);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.IdleScreen);
        if (refresh) {
            NowPlayingContext_1.default.refreshUIConfig();
        }
    }
    configSaveExtraScreenSettings(data) {
        const theme = {
            active: data.theme.value
        };
        NowPlayingContext_1.default.setConfigValue('theme', theme);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.Theme);
    }
    configSavePerformanceSettings(data) {
        const syncedLyricsDelay = data.syncedLyricsDelay !== '' ? parseInt(data.syncedLyricsDelay, 10) : 0;
        const settings = {
            transitionEffectsKiosk: data.transitionEffectsKiosk,
            transitionEffectsOtherDevices: data.transitionEffectsOtherDevices,
            unmountScreensOnExit: data.unmountScreensOnExit.value,
            unmountNowPlayingScreenOnExit: data.unmountNowPlayingScreenOnExit,
            unmountBrowseScreenOnExit: data.unmountBrowseScreenOnExit,
            unmountQueueScreenOnExit: data.unmountQueueScreenOnExit,
            unmountVolumioScreenOnExit: data.unmountVolumioScreenOnExit,
            syncedLyricsDelay
        };
        NowPlayingContext_1.default.setConfigValue('performance', settings);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.Performance);
    }
    configBackupConfig(data) {
        const backupName = data.backupName?.trim();
        if (!backupName) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_NO_BACKUP_NAME'));
            return;
        }
        try {
            ConfigBackupHelper_1.default.createBackup(backupName);
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().error(`[now-playing] Failed to backup config: ${error.message}`);
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_BACKUP_CONFIG', NowPlayingContext_1.default.getErrorMessage('', error, false)));
            return;
        }
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_BACKUP_CREATED'));
        NowPlayingContext_1.default.refreshUIConfig();
    }
    async configRestoreConfigFromBackup(data) {
        const backupName = data.backupName?.trim();
        if (!backupName) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_NO_BACKUP_NAME'));
            return;
        }
        try {
            await ConfigBackupHelper_1.default.replacePluginConfigWithBackup(backupName);
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().error(`[now-playing] Failed to restore config: ${error.message}`);
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_RESTORE_CONFIG', NowPlayingContext_1.default.getErrorMessage('', error, false)));
            return;
        }
        /**
         * ConfigBackupHelper only replaces the plugin config with backup. We still need
         * to restart the plugin for changed config to take effect.
         */
        const configFilePath = NowPlayingContext_1.default.getConfigFilePath();
        await __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_doOnStop).call(this);
        __classPrivateFieldGet(this, _ControllerNowPlaying_config, "f").loadFile(configFilePath);
        await __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_doOnStart).call(this);
        this.broadcastRefresh();
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_CONFIG_RESTORED', backupName));
        NowPlayingContext_1.default.refreshUIConfig();
    }
    configDeleteConfigBackup(data) {
        const backupName = data.backupName?.trim();
        if (!backupName) {
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_NO_BACKUP_NAME'));
            return;
        }
        try {
            ConfigBackupHelper_1.default.deleteBackup(backupName);
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().error(`[now-playing] Failed to delete config backup: ${error.message}`);
            NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_DELETE_BACKUP', NowPlayingContext_1.default.getErrorMessage('', error, false)));
            return;
        }
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_BACKUP_DELETED'));
        NowPlayingContext_1.default.refreshUIConfig();
    }
    clearMetadataCache() {
        MetadataAPI_1.default.clearCache();
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_CACHE_CLEARED'));
    }
    clearWeatherCache() {
        WeatherAPI_1.default.clearCache();
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_CACHE_CLEARED'));
    }
    broadcastRefresh() {
        NowPlayingContext_1.default.broadcastMessage('nowPlayingRefresh');
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_BROADCASTED_COMMAND'));
    }
    // Socket callMethod
    getPluginInfo() {
        return {
            message: 'nowPlayingPluginInfo',
            payload: SystemUtils.getPluginInfo()
        };
    }
    // Plugin lifecycle
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerNowPlaying_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerNowPlaying_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerNowPlaying_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerNowPlaying_config, "f").loadFile(configFile);
        return kew_1.default.resolve(true);
    }
    onStart() {
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_doOnStart).call(this));
    }
    onStop() {
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_doOnStop).call(this));
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
}
_ControllerNowPlaying_context = new WeakMap(), _ControllerNowPlaying_config = new WeakMap(), _ControllerNowPlaying_commandRouter = new WeakMap(), _ControllerNowPlaying_volumioLanguageChangeCallback = new WeakMap(), _ControllerNowPlaying_instances = new WeakSet(), _ControllerNowPlaying_doGetUIConfig = async function _ControllerNowPlaying_doGetUIConfig() {
    const langCode = __classPrivateFieldGet(this, _ControllerNowPlaying_commandRouter, "f").sharedVars.get('language_code');
    const _uiconf = await (0, Misc_1.kewToJSPromise)(__classPrivateFieldGet(this, _ControllerNowPlaying_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`));
    const uiconf = UIConfigHelper_1.default.observe(_uiconf);
    const daemonUIConf = uiconf.section_daemon;
    const localizationUIConf = uiconf.section_localization;
    const metadataServiceUIConf = uiconf.section_metadata_service;
    const startupOptionsUIConf = uiconf.section_startup_options;
    const contentRegionUIConf = uiconf.section_content_region;
    const layoutsUIConf = uiconf.section_layouts;
    const textStylesUIConf = uiconf.section_text_styles;
    const widgetStylesUIConf = uiconf.section_widget_styles;
    const albumartStylesUIConf = uiconf.section_album_art_style;
    const backgroundStylesUIConf = uiconf.section_background_style;
    const actionPanelUIConf = uiconf.section_action_panel;
    const dockedMenuUIConf = uiconf.section_docked_menu;
    const dockedActionPanelTriggerUIConf = uiconf.section_docked_action_panel_trigger;
    const dockedVolumeIndicatorUIConf = uiconf.section_docked_volume_indicator;
    const dockedClockUIConf = uiconf.section_docked_clock;
    const dockedWeatherUIConf = uiconf.section_docked_weather;
    const dockedMediaFormatUIConf = uiconf.section_docked_media_format;
    const idleScreenUIConf = uiconf.section_idle_view;
    const extraScreensUIConf = uiconf.section_extra_screens;
    const kioskUIConf = uiconf.section_kiosk;
    const performanceUIConf = uiconf.section_performance;
    const backupConfigUIConf = uiconf.section_backup_config;
    const nowPlayingScreen = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
    const volumioBackgrounds = (0, Misc_1.getVolumioBackgrounds)();
    const myBackgrounds = MyBackgroundMonitor_1.default.getImages();
    /**
     * Daemon conf
     */
    const port = NowPlayingContext_1.default.getConfigValue('port');
    daemonUIConf.content.port.value = port;
    // Get Now Playing Url
    const thisDevice = NowPlayingContext_1.default.getDeviceInfo();
    const url = `${thisDevice.host}:${port}`;
    const previewUrl = `${url}/preview`;
    daemonUIConf.content.url.value = url;
    daemonUIConf.content.previewUrl.value = previewUrl;
    daemonUIConf.content.openPreview.onClick = {
        type: 'openUrl',
        url: previewUrl
    };
    /**
     * Localization conf
     */
    const localization = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Localization);
    const geoCoordSetupUrl = `${url}/geo_coord_setup`;
    localizationUIConf.content.geoCoordinates.value = localization.geoCoordinates;
    localizationUIConf.content.geoCoordinatesGuide.onClick = {
        type: 'openUrl',
        url: geoCoordSetupUrl
    };
    // Locale list
    const localeList = ConfigHelper_1.default.getLocaleList();
    const matchLocale = localeList.find((lc) => lc.value === localization.locale);
    if (matchLocale) {
        localizationUIConf.content.locale.value = matchLocale;
    }
    else {
        localizationUIConf.content.locale.value = {
            value: localization.locale,
            label: localization.locale
        };
    }
    localizationUIConf.content.locale.options = localeList;
    // Timezone list
    const timezoneList = await ConfigHelper_1.default.getTimezoneList();
    const matchTimezone = timezoneList.find((tz) => tz.value === localization.timezone);
    if (matchTimezone) {
        localizationUIConf.content.timezone.value = matchTimezone;
    }
    else {
        localizationUIConf.content.timezone.value = {
            value: localization.timezone,
            label: localization.timezone
        };
    }
    localizationUIConf.content.timezone.options = timezoneList;
    // Unit system
    localizationUIConf.content.unitSystem.value = {
        value: localization.unitSystem,
        label: ''
    };
    switch (localization.unitSystem) {
        case 'imperial':
            localizationUIConf.content.unitSystem.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_UNITS_IMPERIAL');
            break;
        default: // Metric
            localizationUIConf.content.unitSystem.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_UNITS_METRIC');
    }
    /**
     * Metadata Service conf
     */
    const metadataServiceOptions = NowPlayingContext_1.default.getConfigValue('metadataService');
    metadataServiceUIConf.content.geniusAccessToken.value = metadataServiceOptions.geniusAccessToken;
    metadataServiceUIConf.content.excludeParenthesized.value = metadataServiceOptions.excludeParenthesized;
    metadataServiceUIConf.content.parenthesisType.value = {
        value: metadataServiceOptions.parenthesisType,
        label: ''
    };
    switch (metadataServiceOptions.parenthesisType) {
        case 'round':
            metadataServiceUIConf.content.parenthesisType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ROUND_BRACKETS');
            break;
        case 'square':
            metadataServiceUIConf.content.parenthesisType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_SQUARE_BRACKETS');
            break;
        case 'round+square':
            metadataServiceUIConf.content.parenthesisType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ROUND_SQUARE_BRACKETS');
            break;
    }
    const accessTokenSetupUrl = `${url}/genius_setup`;
    metadataServiceUIConf.content.accessTokenGuide.onClick = {
        type: 'openUrl',
        url: accessTokenSetupUrl
    };
    metadataServiceUIConf.content.queryMusicServices.value = metadataServiceOptions.queryMusicServices;
    metadataServiceUIConf.content.enableSyncedLyrics.value = metadataServiceOptions.enableSyncedLyrics;
    const startupOptions = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Startup);
    startupOptionsUIConf.content.activeScreen.value = {
        value: startupOptions.activeScreen,
        label: ''
    };
    switch (startupOptions.activeScreen) {
        case 'nowPlaying.infoView':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NP_INFO_SONG');
            break;
        case 'nowPlaying.infoView.artist':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NP_INFO_ARTIST');
            break;
        case 'nowPlaying.infoView.album':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NP_INFO_ALBUM');
            break;
        case 'nowPlaying.infoView.lyrics':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NP_INFO_LYRICS');
            break;
        case 'browse':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_BROWSE');
            break;
        case 'volumio':
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VOLUMIO');
            break;
        default:
            startupOptionsUIConf.content.activeScreen.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NP_BASIC');
    }
    startupOptionsUIConf.content.activateIdleScreen.value = startupOptions.activateIdleScreen;
    /**
     * Content region conf
     */
    const contentRegion = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.ContentRegion);
    contentRegionUIConf.content.padding.value = {
        value: contentRegion.padding,
        label: contentRegion.padding == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    contentRegionUIConf.content.npBasicViewPadding.value = contentRegion.npBasicViewPadding;
    contentRegionUIConf.content.npBasicViewPaddingPortrait.value = contentRegion.npBasicViewPaddingPortrait;
    contentRegionUIConf.content.npInfoViewPadding.value = contentRegion.npInfoViewPadding;
    contentRegionUIConf.content.npInfoViewPaddingPortrait.value = contentRegion.npInfoViewPaddingPortrait;
    /**
     * Layouts conf
     */
    const infoViewLayout = nowPlayingScreen.infoViewLayout;
    layoutsUIConf.content.npInfoViewLayoutType.value = {
        value: infoViewLayout.type,
        label: infoViewLayout.type == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    layoutsUIConf.content.npInfoViewLayoutPreferBiggerAlbumArt.value = infoViewLayout.preferBiggerAlbumArt;
    layoutsUIConf.content.npInfoViewLayout.value = {
        value: infoViewLayout.layout,
        label: infoViewLayout.layout == 'big-art' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_BIG_ART_LAYOUT') :
            infoViewLayout.layout == 'ultra-wide' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_ULTRA_WIDE_LAYOUT') :
                NowPlayingContext_1.default.getI18n('NOW_PLAYING_STANDARD_LAYOUT')
    };
    /**
     * Text Styles conf
     */
    textStylesUIConf.content.trackInfoVisibility.value = {
        value: nowPlayingScreen.trackInfoVisibility,
        label: nowPlayingScreen.trackInfoVisibility == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.titleVisibility.value = nowPlayingScreen.titleVisibility;
    textStylesUIConf.content.artistVisibility.value = nowPlayingScreen.artistVisibility;
    textStylesUIConf.content.albumVisibility.value = nowPlayingScreen.albumVisibility;
    textStylesUIConf.content.mediaInfoVisibility.value = nowPlayingScreen.mediaInfoVisibility;
    textStylesUIConf.content.fontStyles.value = {
        value: nowPlayingScreen.fontStyles,
        label: nowPlayingScreen.fontStyles == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    FontHelper_1.default.fillUIConfSelectElements({ el: textStylesUIConf.content.titleFontStyle, value: nowPlayingScreen.titleFontStyle }, { el: textStylesUIConf.content.artistFontStyle, value: nowPlayingScreen.artistFontStyle }, { el: textStylesUIConf.content.albumFontStyle, value: nowPlayingScreen.albumFontStyle }, { el: textStylesUIConf.content.mediaInfoFontStyle, value: nowPlayingScreen.mediaInfoFontStyle }, { el: textStylesUIConf.content.seekTimeFontStyle, value: nowPlayingScreen.seekTimeFontStyle }, { el: textStylesUIConf.content.metadataFontStyle, value: nowPlayingScreen.metadataFontStyle });
    textStylesUIConf.content.fontSizes.value = {
        value: nowPlayingScreen.fontSizes,
        label: nowPlayingScreen.fontSizes == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.titleFontSize.value = nowPlayingScreen.titleFontSize;
    textStylesUIConf.content.artistFontSize.value = nowPlayingScreen.artistFontSize;
    textStylesUIConf.content.albumFontSize.value = nowPlayingScreen.albumFontSize;
    textStylesUIConf.content.mediaInfoFontSize.value = nowPlayingScreen.mediaInfoFontSize;
    textStylesUIConf.content.seekTimeFontSize.value = nowPlayingScreen.seekTimeFontSize;
    textStylesUIConf.content.metadataFontSize.value = nowPlayingScreen.metadataFontSize;
    textStylesUIConf.content.syncedLyricsCurrentLineFontSize.value = nowPlayingScreen.syncedLyricsCurrentLineFontSize;
    textStylesUIConf.content.fontColors.value = {
        value: nowPlayingScreen.fontColors,
        label: nowPlayingScreen.fontColors == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.titleFontColor.value = nowPlayingScreen.titleFontColor;
    textStylesUIConf.content.artistFontColor.value = nowPlayingScreen.artistFontColor;
    textStylesUIConf.content.albumFontColor.value = nowPlayingScreen.albumFontColor;
    textStylesUIConf.content.mediaInfoFontColor.value = nowPlayingScreen.mediaInfoFontColor;
    textStylesUIConf.content.seekTimeFontColor.value = nowPlayingScreen.seekTimeFontColor;
    textStylesUIConf.content.metadataFontColor.value = nowPlayingScreen.metadataFontColor;
    textStylesUIConf.content.syncedLyricsColor.value = nowPlayingScreen.syncedLyricsColor;
    textStylesUIConf.content.syncedLyricsCurrentLineColor.value = nowPlayingScreen.syncedLyricsCurrentLineColor;
    textStylesUIConf.content.textMargins.value = {
        value: nowPlayingScreen.textMargins,
        label: nowPlayingScreen.textMargins == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.titleMargin.value = nowPlayingScreen.titleMargin;
    textStylesUIConf.content.artistMargin.value = nowPlayingScreen.artistMargin;
    textStylesUIConf.content.albumMargin.value = nowPlayingScreen.albumMargin;
    textStylesUIConf.content.mediaInfoMargin.value = nowPlayingScreen.mediaInfoMargin;
    textStylesUIConf.content.textAlignmentH.value = {
        value: nowPlayingScreen.textAlignmentH,
        label: ''
    };
    switch (nowPlayingScreen.textAlignmentH) {
        case 'center':
            textStylesUIConf.content.textAlignmentH.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
            break;
        case 'right':
            textStylesUIConf.content.textAlignmentH.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default: // Left
            textStylesUIConf.content.textAlignmentH.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
    }
    textStylesUIConf.content.textAlignmentV.value = {
        value: nowPlayingScreen.textAlignmentV,
        label: ''
    };
    switch (nowPlayingScreen.textAlignmentV) {
        case 'center':
            textStylesUIConf.content.textAlignmentV.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
            break;
        case 'flex-end':
            textStylesUIConf.content.textAlignmentV.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'space-between':
            textStylesUIConf.content.textAlignmentV.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_SPREAD');
            break;
        default: // Top
            textStylesUIConf.content.textAlignmentV.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
    }
    textStylesUIConf.content.textAlignmentLyrics.value = {
        value: nowPlayingScreen.textAlignmentLyrics,
        label: ''
    };
    switch (nowPlayingScreen.textAlignmentLyrics) {
        case 'center':
            textStylesUIConf.content.textAlignmentLyrics.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
            break;
        case 'right':
            textStylesUIConf.content.textAlignmentLyrics.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default: // Left
            textStylesUIConf.content.textAlignmentLyrics.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
    }
    textStylesUIConf.content.maxLines.value = {
        value: nowPlayingScreen.maxLines,
        label: nowPlayingScreen.maxLines == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.maxTitleLines.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.maxTitleLines);
    textStylesUIConf.content.maxArtistLines.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.maxArtistLines);
    textStylesUIConf.content.maxAlbumLines.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.maxAlbumLines);
    textStylesUIConf.content.trackInfoOrder.value = {
        value: nowPlayingScreen.trackInfoOrder,
        label: nowPlayingScreen.trackInfoOrder == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    textStylesUIConf.content.trackInfoTitleOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.trackInfoTitleOrder);
    textStylesUIConf.content.trackInfoArtistOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.trackInfoArtistOrder);
    textStylesUIConf.content.trackInfoAlbumOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.trackInfoAlbumOrder);
    textStylesUIConf.content.trackInfoMediaInfoOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(nowPlayingScreen.trackInfoMediaInfoOrder);
    textStylesUIConf.content.trackInfoMarqueeTitle.value = nowPlayingScreen.trackInfoMarqueeTitle;
    /**
     * Widget Styles conf
     */
    widgetStylesUIConf.content.widgetColors.value = {
        value: nowPlayingScreen.widgetColors,
        label: nowPlayingScreen.widgetColors == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    widgetStylesUIConf.content.widgetPrimaryColor.value = nowPlayingScreen.widgetPrimaryColor;
    widgetStylesUIConf.content.widgetHighlightColor.value = nowPlayingScreen.widgetHighlightColor;
    widgetStylesUIConf.content.widgetVisibility.value = {
        value: nowPlayingScreen.widgetVisibility,
        label: nowPlayingScreen.widgetVisibility == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    widgetStylesUIConf.content.playbackButtonsVisibility.value = nowPlayingScreen.playbackButtonsVisibility;
    widgetStylesUIConf.content.seekbarVisibility.value = nowPlayingScreen.seekbarVisibility;
    widgetStylesUIConf.content.playbackButtonSizeType.value = {
        value: nowPlayingScreen.playbackButtonSizeType,
        label: nowPlayingScreen.playbackButtonSizeType == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    widgetStylesUIConf.content.playbackButtonSize.value = nowPlayingScreen.playbackButtonSize;
    widgetStylesUIConf.content.seekbarStyling.value = {
        value: nowPlayingScreen.seekbarStyling,
        label: nowPlayingScreen.seekbarStyling == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    widgetStylesUIConf.content.seekbarThickness.value = nowPlayingScreen.seekbarThickness;
    widgetStylesUIConf.content.seekbarBorderRadius.value = nowPlayingScreen.seekbarBorderRadius;
    widgetStylesUIConf.content.seekbarShowThumb.value = nowPlayingScreen.seekbarShowThumb;
    widgetStylesUIConf.content.seekbarThumbSize.value = nowPlayingScreen.seekbarThumbSize;
    widgetStylesUIConf.content.widgetMargins.value = {
        value: nowPlayingScreen.widgetMargins,
        label: nowPlayingScreen.widgetMargins == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    widgetStylesUIConf.content.playbackButtonsMargin.value = nowPlayingScreen.playbackButtonsMargin;
    widgetStylesUIConf.content.seekbarMargin.value = nowPlayingScreen.seekbarMargin;
    /**
     * Albumart Styles conf
     */
    albumartStylesUIConf.content.albumartVisibility.value = nowPlayingScreen.albumartVisibility;
    albumartStylesUIConf.content.albumartSize.value = {
        value: nowPlayingScreen.albumartSize,
        label: nowPlayingScreen.albumartSize == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    albumartStylesUIConf.content.albumartWidth.value = nowPlayingScreen.albumartWidth;
    albumartStylesUIConf.content.albumartHeight.value = nowPlayingScreen.albumartHeight;
    albumartStylesUIConf.content.albumartFit.value = {
        value: nowPlayingScreen.albumartFit,
        label: ''
    };
    switch (nowPlayingScreen.albumartFit) {
        case 'contain':
            albumartStylesUIConf.content.albumartFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            albumartStylesUIConf.content.albumartFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            albumartStylesUIConf.content.albumartFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    albumartStylesUIConf.content.albumartBorder.value = nowPlayingScreen.albumartBorder;
    albumartStylesUIConf.content.albumartBorderRadius.value = nowPlayingScreen.albumartBorderRadius;
    albumartStylesUIConf.content.albumartMargin.value = nowPlayingScreen.albumartMargin;
    if (!nowPlayingScreen.albumartVisibility) {
        albumartStylesUIConf.content = [albumartStylesUIConf.content.albumartVisibility];
        if (albumartStylesUIConf.saveButton) {
            albumartStylesUIConf.saveButton.data = ['albumartVisibility'];
        }
    }
    /**
    * Background Styles Conf
    */
    const backgroundSettings = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Background);
    let volumioBackgroundImage = backgroundSettings.volumioBackgroundImage;
    let backgroundStylesMyBackgroundImage = backgroundSettings.myBackgroundImage;
    backgroundStylesUIConf.content.backgroundType.value = {
        value: backgroundSettings.backgroundType,
        label: ''
    };
    switch (backgroundSettings.backgroundType) {
        case 'albumart':
            backgroundStylesUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ALBUM_ART');
            break;
        case 'color':
            backgroundStylesUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_COLOR');
            break;
        case 'volumioBackground':
            backgroundStylesUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VOLUMIO_BACKGROUND');
            break;
        case 'myBackground':
            backgroundStylesUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_MY_BACKGROUND');
            break;
        default:
            backgroundStylesUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT');
    }
    backgroundStylesUIConf.content.backgroundColor.value = backgroundSettings.backgroundColor;
    backgroundStylesUIConf.content.albumartBackgroundFit.value = {
        value: backgroundSettings.albumartBackgroundFit,
        label: ''
    };
    switch (backgroundSettings.albumartBackgroundFit) {
        case 'contain':
            backgroundStylesUIConf.content.albumartBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            backgroundStylesUIConf.content.albumartBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            backgroundStylesUIConf.content.albumartBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    backgroundStylesUIConf.content.albumartBackgroundPosition.value = {
        value: backgroundSettings.albumartBackgroundPosition,
        label: ''
    };
    switch (backgroundSettings.albumartBackgroundPosition) {
        case 'top':
            backgroundStylesUIConf.content.albumartBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'left':
            backgroundStylesUIConf.content.albumartBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'bottom':
            backgroundStylesUIConf.content.albumartBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'right':
            backgroundStylesUIConf.content.albumartBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default:
            backgroundStylesUIConf.content.albumartBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
    }
    backgroundStylesUIConf.content.albumartBackgroundBlur.value = backgroundSettings.albumartBackgroundBlur;
    backgroundStylesUIConf.content.albumartBackgroundScale.value = backgroundSettings.albumartBackgroundScale;
    if (volumioBackgroundImage !== '' && !volumioBackgrounds.includes(volumioBackgroundImage)) {
        volumioBackgroundImage = ''; // Image no longer exists
    }
    backgroundStylesUIConf.content.volumioBackgroundImage.value = {
        value: volumioBackgroundImage,
        label: volumioBackgroundImage
    };
    backgroundStylesUIConf.content.volumioBackgroundImage.options = volumioBackgrounds.map((bg) => ({
        value: bg,
        label: bg
    }));
    backgroundStylesUIConf.content.volumioBackgroundFit.value = {
        value: backgroundSettings.volumioBackgroundFit,
        label: ''
    };
    switch (backgroundSettings.volumioBackgroundFit) {
        case 'contain':
            backgroundStylesUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            backgroundStylesUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            backgroundStylesUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    backgroundStylesUIConf.content.volumioBackgroundPosition.value = {
        value: backgroundSettings.volumioBackgroundPosition,
        label: ''
    };
    switch (backgroundSettings.volumioBackgroundPosition) {
        case 'top':
            backgroundStylesUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'left':
            backgroundStylesUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'bottom':
            backgroundStylesUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'right':
            backgroundStylesUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default:
            backgroundStylesUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
    }
    backgroundStylesUIConf.content.volumioBackgroundBlur.value = backgroundSettings.volumioBackgroundBlur;
    backgroundStylesUIConf.content.volumioBackgroundScale.value = backgroundSettings.volumioBackgroundScale;
    if (backgroundSettings.myBackgroundImageType === 'fixed') {
        if (backgroundStylesMyBackgroundImage !== '' && !myBackgrounds.find((bg) => bg.name === backgroundStylesMyBackgroundImage)) {
            backgroundStylesMyBackgroundImage = ''; // Image no longer exists
        }
        backgroundStylesUIConf.content.myBackgroundImage.value = {
            value: backgroundStylesMyBackgroundImage,
            label: backgroundStylesMyBackgroundImage
        };
    }
    else { // Random
        backgroundStylesUIConf.content.myBackgroundImage.value = {
            value: '/RANDOM/',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_RANDOM')
        };
    }
    if (myBackgrounds.length > 0) {
        backgroundStylesUIConf.content.myBackgroundImage.options.push({
            value: '/SEPARATOR/',
            label: '-'.repeat(NowPlayingContext_1.default.getI18n('NOW_PLAYING_RANDOM').length)
        });
        myBackgrounds.forEach((bg) => {
            backgroundStylesUIConf.content.myBackgroundImage.options.push({
                value: bg.name,
                label: bg.name
            });
        });
    }
    backgroundStylesUIConf.content.myBackgroundRandomRefreshInterval.value = backgroundSettings.myBackgroundRandomRefreshInterval;
    backgroundStylesUIConf.content.myBackgroundRandomRefreshOnTrackChange.value = backgroundSettings.myBackgroundRandomRefreshOnTrackChange;
    backgroundStylesUIConf.content.myBackgroundFit.value = {
        value: backgroundSettings.myBackgroundFit,
        label: ''
    };
    switch (backgroundSettings.myBackgroundFit) {
        case 'contain':
            backgroundStylesUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            backgroundStylesUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            backgroundStylesUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    backgroundStylesUIConf.content.myBackgroundPosition.value = {
        value: backgroundSettings.myBackgroundPosition,
        label: ''
    };
    switch (backgroundSettings.myBackgroundPosition) {
        case 'top':
            backgroundStylesUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'left':
            backgroundStylesUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'bottom':
            backgroundStylesUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'right':
            backgroundStylesUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default:
            backgroundStylesUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
    }
    backgroundStylesUIConf.content.myBackgroundBlur.value = backgroundSettings.myBackgroundBlur;
    backgroundStylesUIConf.content.myBackgroundScale.value = backgroundSettings.myBackgroundScale;
    backgroundStylesUIConf.content.backgroundOverlay.value = {
        value: backgroundSettings.backgroundOverlay,
        label: ''
    };
    switch (backgroundSettings.backgroundOverlay) {
        case 'customColor':
            backgroundStylesUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_COLOR');
            break;
        case 'customGradient':
            backgroundStylesUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
            break;
        case 'none':
            backgroundStylesUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NONE');
            break;
        default:
            backgroundStylesUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT');
    }
    backgroundStylesUIConf.content.backgroundOverlayColor.value = backgroundSettings.backgroundOverlayColor;
    backgroundStylesUIConf.content.backgroundOverlayColorOpacity.value = backgroundSettings.backgroundOverlayColorOpacity;
    backgroundStylesUIConf.content.backgroundOverlayGradient.value = backgroundSettings.backgroundOverlayGradient;
    backgroundStylesUIConf.content.backgroundOverlayGradientOpacity.value = backgroundSettings.backgroundOverlayGradientOpacity;
    /**
     * Action Panel
     */
    const actionPanelSettings = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.ActionPanel);
    actionPanelUIConf.content.showVolumeSlider.value = actionPanelSettings.showVolumeSlider;
    /**
     * Docked Menu
     */
    const dockedMenu = nowPlayingScreen.dockedMenu;
    dockedMenuUIConf.content.enabled.value = dockedMenu.enabled;
    dockedMenuUIConf.content.iconSettings.value = {
        value: dockedMenu.iconSettings,
        label: dockedMenu.iconSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedMenuUIConf.content.iconStyle.value = {
        value: dockedMenu.iconStyle,
        label: ''
    };
    switch (dockedMenu.iconStyle) {
        case 'ellipsis_h':
            dockedMenuUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ELLIPSIS_H');
            break;
        case 'hamburger':
            dockedMenuUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_HAMBURGER');
            break;
        default:
            dockedMenuUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ELLIPSIS_V');
    }
    dockedMenuUIConf.content.iconSize.value = dockedMenu.iconSize;
    dockedMenuUIConf.content.margin.value = dockedMenu.margin;
    if (!dockedMenu.enabled) {
        dockedMenuUIConf.content = [dockedMenuUIConf.content.enabled];
        if (dockedMenuUIConf.saveButton) {
            dockedMenuUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Docked Action Panel Trigger
     */
    const dockedActionPanelTrigger = nowPlayingScreen.dockedActionPanelTrigger;
    dockedActionPanelTriggerUIConf.content.enabled.value = dockedActionPanelTrigger.enabled;
    dockedActionPanelTriggerUIConf.content.iconSettings.value = {
        value: dockedActionPanelTrigger.iconSettings,
        label: dockedActionPanelTrigger.iconSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedActionPanelTriggerUIConf.content.iconStyle.value = {
        value: dockedActionPanelTrigger.iconStyle,
        label: ''
    };
    switch (dockedActionPanelTrigger.iconStyle) {
        case 'expand_circle_down':
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CHEVRON_CIRCLE');
            break;
        case 'arrow_drop_down':
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CARET');
            break;
        case 'arrow_drop_down_circle':
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CARET_CIRCLE');
            break;
        case 'arrow_downward':
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ARROW');
            break;
        case 'arrow_circle_down':
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ARROW_CIRCLE');
            break;
        default:
            dockedActionPanelTriggerUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CHEVRON');
    }
    dockedActionPanelTriggerUIConf.content.iconSize.value = dockedActionPanelTrigger.iconSize;
    dockedActionPanelTriggerUIConf.content.iconColor.value = dockedActionPanelTrigger.iconColor;
    dockedActionPanelTriggerUIConf.content.opacity.value = dockedActionPanelTrigger.opacity;
    dockedActionPanelTriggerUIConf.content.margin.value = dockedActionPanelTrigger.margin;
    if (!dockedActionPanelTrigger.enabled) {
        dockedActionPanelTriggerUIConf.content = [dockedActionPanelTriggerUIConf.content.enabled];
        if (dockedActionPanelTriggerUIConf.saveButton) {
            dockedActionPanelTriggerUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Docked Volume Indicator
     */
    const dockedVolumeIndicator = nowPlayingScreen.dockedVolumeIndicator;
    dockedVolumeIndicatorUIConf.content.enabled.value = dockedVolumeIndicator.enabled;
    dockedVolumeIndicatorUIConf.content.placement.value = {
        value: dockedVolumeIndicator.placement,
        label: ''
    };
    switch (dockedVolumeIndicator.placement) {
        case 'top-left':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
            break;
        case 'top':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'top-right':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
            break;
        case 'left':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'right':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        case 'bottom-left':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
            break;
        case 'bottom':
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        default:
            dockedVolumeIndicatorUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
    }
    dockedVolumeIndicatorUIConf.content.displayOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(dockedVolumeIndicator.displayOrder);
    dockedVolumeIndicatorUIConf.content.fontSettings.value = {
        value: dockedVolumeIndicator.fontSettings,
        label: dockedVolumeIndicator.fontSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedVolumeIndicatorUIConf.content.fontSize.value = dockedVolumeIndicator.fontSize;
    dockedVolumeIndicatorUIConf.content.fontSizePercentSymbol.value = dockedVolumeIndicator.fontSizePercentSymbol;
    dockedVolumeIndicatorUIConf.content.fontColor.value = dockedVolumeIndicator.fontColor;
    dockedVolumeIndicatorUIConf.content.iconSettings.value = {
        value: dockedVolumeIndicator.iconSettings,
        label: dockedVolumeIndicator.iconSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedVolumeIndicatorUIConf.content.iconSize.value = dockedVolumeIndicator.iconSize;
    dockedVolumeIndicatorUIConf.content.iconColor.value = dockedVolumeIndicator.iconColor;
    dockedVolumeIndicatorUIConf.content.margin.value = dockedVolumeIndicator.margin;
    dockedVolumeIndicatorUIConf.content.showVolumeBarOnClick.value = dockedVolumeIndicator.showVolumeBarOnClick;
    dockedVolumeIndicatorUIConf.content.volumeBarPosition.value = {
        value: dockedVolumeIndicator.volumeBarPosition,
        label: ''
    };
    switch (dockedVolumeIndicator.volumeBarPosition) {
        case 'anchored':
            dockedVolumeIndicatorUIConf.content.volumeBarPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VOL_BAR_ANCHORED');
            break;
        default:
            dockedVolumeIndicatorUIConf.content.volumeBarPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VOL_BAR_CENTER');
    }
    dockedVolumeIndicatorUIConf.content.volumeBarOrientation.value = {
        value: dockedVolumeIndicator.volumeBarOrientation,
        label: ''
    };
    switch (dockedVolumeIndicator.volumeBarOrientation) {
        case 'vertical':
            dockedVolumeIndicatorUIConf.content.volumeBarOrientation.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VERTICAL');
            break;
        default:
            dockedVolumeIndicatorUIConf.content.volumeBarOrientation.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_HORIZONTAL');
    }
    if (!dockedVolumeIndicator.enabled) {
        dockedVolumeIndicatorUIConf.content = [dockedVolumeIndicatorUIConf.content.enabled];
        if (dockedVolumeIndicatorUIConf.saveButton) {
            dockedVolumeIndicatorUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Docked Clock
     */
    const dockedClock = nowPlayingScreen.dockedClock;
    dockedClockUIConf.content.enabled.value = dockedClock.enabled;
    dockedClockUIConf.content.placement.value = {
        value: dockedClock.placement,
        label: ''
    };
    switch (dockedClock.placement) {
        case 'top-left':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
            break;
        case 'top':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'top-right':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
            break;
        case 'left':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'right':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        case 'bottom-left':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
            break;
        case 'bottom':
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        default:
            dockedClockUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
    }
    dockedClockUIConf.content.displayOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(dockedClock.displayOrder);
    dockedClockUIConf.content.showInfo.value = {
        value: dockedClock.showInfo,
        label: ''
    };
    switch (dockedClock.showInfo) {
        case 'time':
            dockedClockUIConf.content.showInfo.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_TIME_ONLY');
            break;
        case 'date':
            dockedClockUIConf.content.showInfo.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DATE_ONLY');
            break;
        default:
            dockedClockUIConf.content.showInfo.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DATE_TIME');
    }
    dockedClockUIConf.content.fontSettings.value = {
        value: dockedClock.fontSettings,
        label: dockedClock.fontSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedClockUIConf.content.fontSize.value = dockedClock.fontSize;
    dockedClockUIConf.content.dateColor.value = dockedClock.dateColor;
    dockedClockUIConf.content.timeColor.value = dockedClock.timeColor;
    dockedClockUIConf.content.dateFormat.value = {
        value: dockedClock.dateFormat,
        label: dockedClock.dateFormat == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedClockUIConf.content.yearFormat.value = {
        value: dockedClock.yearFormat,
        label: ''
    };
    switch (dockedClock.yearFormat) {
        case 'numeric':
            dockedClockUIConf.content.yearFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NUMERIC_YEAR');
            break;
        case '2-digit':
            dockedClockUIConf.content.yearFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_2DIGIT_YEAR');
            break;
        default:
            dockedClockUIConf.content.yearFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NONE');
    }
    dockedClockUIConf.content.monthFormat.value = {
        value: dockedClock.monthFormat,
        label: ''
    };
    switch (dockedClock.monthFormat) {
        case 'numeric':
            dockedClockUIConf.content.monthFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NUMERIC_MONTH');
            break;
        case '2-digit':
            dockedClockUIConf.content.monthFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_2DIGIT_MONTH');
            break;
        case 'long':
            dockedClockUIConf.content.monthFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_LONG_MONTH');
            break;
        default:
            dockedClockUIConf.content.monthFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_SHORT_MONTH');
    }
    dockedClockUIConf.content.dayFormat.value = {
        value: dockedClock.dayFormat,
        label: ''
    };
    switch (dockedClock.dayFormat) {
        case '2-digit':
            dockedClockUIConf.content.dayFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_2DIGIT_DAY');
            break;
        default:
            dockedClockUIConf.content.dayFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NUMERIC_DAY');
    }
    dockedClockUIConf.content.dayOfWeekFormat.value = {
        value: dockedClock.dayOfWeekFormat,
        label: ''
    };
    switch (dockedClock.dayOfWeekFormat) {
        case 'long':
            dockedClockUIConf.content.dayOfWeekFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_LONG_DAY_OF_WEEK');
            break;
        case 'short':
            dockedClockUIConf.content.dayOfWeekFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_SHORT_DAY_OF_WEEK');
            break;
        default:
            dockedClockUIConf.content.dayOfWeekFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NONE');
    }
    dockedClockUIConf.content.timeFormat.value = {
        value: dockedClock.timeFormat,
        label: dockedClock.timeFormat == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedClockUIConf.content.hourFormat.value = {
        value: dockedClock.hourFormat,
        label: ''
    };
    switch (dockedClock.hourFormat) {
        case '2-digit':
            dockedClockUIConf.content.hourFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_2DIGIT_HOUR');
            break;
        default:
            dockedClockUIConf.content.hourFormat.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NUMERIC_HOUR');
    }
    dockedClockUIConf.content.hour24.value = dockedClock.hour24;
    dockedClockUIConf.content.showSeconds.value = dockedClock.showSeconds;
    dockedClockUIConf.content.margin.value = dockedClock.margin;
    if (!dockedClock.enabled) {
        dockedClockUIConf.content = [dockedClockUIConf.content.enabled];
        if (dockedClockUIConf.saveButton) {
            dockedClockUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Docked Weather
     */
    const dockedWeather = nowPlayingScreen.dockedWeather;
    dockedWeatherUIConf.content.enabled.value = dockedWeather.enabled;
    dockedWeatherUIConf.content.placement.value = {
        value: dockedWeather.placement,
        label: ''
    };
    switch (dockedWeather.placement) {
        case 'top-left':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
            break;
        case 'top':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'top-right':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
            break;
        case 'left':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'right':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        case 'bottom-left':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
            break;
        case 'bottom':
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        default:
            dockedWeatherUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
    }
    dockedWeatherUIConf.content.displayOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(dockedWeather.displayOrder);
    dockedWeatherUIConf.content.showHumidity.value = dockedWeather.showHumidity;
    dockedWeatherUIConf.content.showWindSpeed.value = dockedWeather.showWindSpeed;
    dockedWeatherUIConf.content.fontSettings.value = {
        value: dockedWeather.fontSettings,
        label: dockedWeather.fontSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedWeatherUIConf.content.fontSize.value = dockedWeather.fontSize;
    dockedWeatherUIConf.content.fontColor.value = dockedWeather.fontColor;
    dockedWeatherUIConf.content.iconSettings.value = {
        value: dockedWeather.iconSettings,
        label: dockedWeather.iconSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedWeatherUIConf.content.iconStyle.value = {
        value: dockedWeather.iconStyle,
        label: ''
    };
    switch (dockedWeather.iconStyle) {
        case 'outline':
            dockedWeatherUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_OUTLINE');
            break;
        case 'mono':
            dockedWeatherUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_MONOCHROME');
            break;
        default:
            dockedWeatherUIConf.content.iconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FILLED');
    }
    dockedWeatherUIConf.content.iconSize.value = dockedWeather.iconSize;
    dockedWeatherUIConf.content.iconMonoColor.value = dockedWeather.iconMonoColor;
    dockedWeatherUIConf.content.iconAnimate.value = dockedWeather.iconAnimate;
    dockedWeatherUIConf.content.margin.value = dockedWeather.margin;
    if (!dockedWeather.enabled) {
        dockedWeatherUIConf.content = [dockedWeatherUIConf.content.enabled];
        if (dockedWeatherUIConf.saveButton) {
            dockedWeatherUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Docked Media Format
     */
    const dockedMediaFormat = nowPlayingScreen.dockedMediaFormat;
    dockedMediaFormatUIConf.content.enabled.value = dockedMediaFormat.enabled;
    dockedMediaFormatUIConf.content.placement.value = {
        value: dockedMediaFormat.placement,
        label: ''
    };
    switch (dockedMediaFormat.placement) {
        case 'top-left':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
            break;
        case 'top':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'top-right':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
            break;
        case 'left':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'right':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        case 'bottom-left':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
            break;
        case 'bottom':
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        default:
            dockedMediaFormatUIConf.content.placement.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
    }
    dockedMediaFormatUIConf.content.displayOrder.value = UIConfigHelper_1.default.sanitizeNumberInput(dockedMediaFormat.displayOrder);
    dockedMediaFormatUIConf.content.fontSettings.value = {
        value: dockedMediaFormat.fontSettings,
        label: dockedMediaFormat.fontSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    dockedMediaFormatUIConf.content.fontSize.value = dockedMediaFormat.fontSize;
    dockedMediaFormatUIConf.content.fontColor.value = dockedMediaFormat.fontColor;
    dockedMediaFormatUIConf.content.margin.value = dockedMediaFormat.margin;
    if (!dockedMediaFormat.enabled) {
        dockedMediaFormatUIConf.content = [dockedMediaFormatUIConf.content.enabled];
        if (dockedMediaFormatUIConf.saveButton) {
            dockedMediaFormatUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Idle Screen conf
     */
    const idleScreen = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.IdleScreen);
    let idleScreenVolumioImage = idleScreen.volumioBackgroundImage;
    let idleScreenMyBackgroundImage = idleScreen.myBackgroundImage;
    idleScreenUIConf.content.enabled.value = {
        value: idleScreen.enabled,
        label: ''
    };
    switch (idleScreen.enabled) {
        case 'all':
            idleScreenUIConf.content.enabled.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ALL_CLIENTS');
            break;
        case 'disabled':
            idleScreenUIConf.content.enabled.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DISABLED');
            break;
        default:
            idleScreenUIConf.content.enabled.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_ONLY');
            break;
    }
    idleScreenUIConf.content.waitTime.value = idleScreen.waitTime;
    idleScreenUIConf.content.showLocation.value = idleScreen.showLocation;
    idleScreenUIConf.content.showWeather.value = idleScreen.showWeather;
    idleScreenUIConf.content.mainAlignment.value = {
        value: idleScreen.mainAlignment,
        label: ''
    };
    switch (idleScreen.mainAlignment) {
        case 'center':
            idleScreenUIConf.content.mainAlignment.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
            break;
        case 'flex-end':
            idleScreenUIConf.content.mainAlignment.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        case 'cycle':
            idleScreenUIConf.content.mainAlignment.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CYCLE');
            break;
        default: // 'flex-start'
            idleScreenUIConf.content.mainAlignment.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
    }
    idleScreenUIConf.content.mainAlignmentCycleInterval.value = UIConfigHelper_1.default.sanitizeNumberInput(idleScreen.mainAlignmentCycleInterval.toString());
    idleScreenUIConf.content.timeFormat.value = {
        value: idleScreen.timeFormat,
        label: idleScreen.timeFormat == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    idleScreenUIConf.content.hour24.value = idleScreen.hour24;
    idleScreenUIConf.content.showSeconds.value = idleScreen.showSeconds;
    idleScreenUIConf.content.fontSizes.value = {
        value: idleScreen.fontSizes,
        label: idleScreen.fontSizes == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    idleScreenUIConf.content.timeFontSize.value = idleScreen.timeFontSize;
    idleScreenUIConf.content.dateFontSize.value = idleScreen.dateFontSize;
    idleScreenUIConf.content.locationFontSize.value = idleScreen.locationFontSize;
    idleScreenUIConf.content.weatherCurrentBaseFontSize.value = idleScreen.weatherCurrentBaseFontSize;
    idleScreenUIConf.content.weatherForecastBaseFontSize.value = idleScreen.weatherForecastBaseFontSize;
    idleScreenUIConf.content.fontColors.value = {
        value: idleScreen.fontColors,
        label: idleScreen.fontColors == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    idleScreenUIConf.content.timeColor.value = idleScreen.timeColor;
    idleScreenUIConf.content.dateColor.value = idleScreen.dateColor;
    idleScreenUIConf.content.locationColor.value = idleScreen.locationColor;
    idleScreenUIConf.content.weatherCurrentColor.value = idleScreen.weatherCurrentColor;
    idleScreenUIConf.content.weatherForecastColor.value = idleScreen.weatherForecastColor;
    idleScreenUIConf.content.weatherIconSettings.value = {
        value: idleScreen.weatherIconSettings,
        label: idleScreen.weatherIconSettings == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    idleScreenUIConf.content.weatherIconStyle.value = {
        value: idleScreen.weatherIconStyle,
        label: ''
    };
    switch (idleScreen.weatherIconStyle) {
        case 'outline':
            idleScreenUIConf.content.weatherIconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_OUTLINE');
            break;
        case 'mono':
            idleScreenUIConf.content.weatherIconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_MONOCHROME');
            break;
        default:
            idleScreenUIConf.content.weatherIconStyle.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FILLED');
            break;
    }
    idleScreenUIConf.content.weatherCurrentIconSize.value = idleScreen.weatherCurrentIconSize;
    idleScreenUIConf.content.weatherForecastIconSize.value = idleScreen.weatherForecastIconSize;
    idleScreenUIConf.content.weatherCurrentIconMonoColor.value = idleScreen.weatherCurrentIconMonoColor;
    idleScreenUIConf.content.weatherForecastIconMonoColor.value = idleScreen.weatherForecastIconMonoColor;
    idleScreenUIConf.content.weatherCurrentIconAnimate.value = idleScreen.weatherCurrentIconAnimate;
    idleScreenUIConf.content.backgroundType.value = {
        value: idleScreen.backgroundType,
        label: ''
    };
    switch (idleScreen.backgroundType) {
        case 'color':
            idleScreenUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_COLOR');
            break;
        case 'volumioBackground':
            idleScreenUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_VOLUMIO_BACKGROUND');
            break;
        case 'myBackground':
            idleScreenUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_MY_BACKGROUND');
            break;
        default:
            idleScreenUIConf.content.backgroundType.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_UNSPLASH');
    }
    idleScreenUIConf.content.backgroundColor.value = idleScreen.backgroundColor;
    if (idleScreenVolumioImage !== '' && !volumioBackgrounds.includes(idleScreenVolumioImage)) {
        idleScreenVolumioImage = ''; // Image no longer exists
    }
    idleScreenUIConf.content.volumioBackgroundImage.value = {
        value: idleScreenVolumioImage,
        label: idleScreenVolumioImage
    };
    idleScreenUIConf.content.volumioBackgroundImage.options = [];
    volumioBackgrounds.forEach((bg) => {
        idleScreenUIConf.content.volumioBackgroundImage.options.push({
            value: bg,
            label: bg
        });
    });
    idleScreenUIConf.content.volumioBackgroundFit.value = {
        value: idleScreen.volumioBackgroundFit,
        label: ''
    };
    switch (idleScreen.volumioBackgroundFit) {
        case 'contain':
            idleScreenUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            idleScreenUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            idleScreenUIConf.content.volumioBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    idleScreenUIConf.content.volumioBackgroundPosition.value = {
        value: idleScreen.volumioBackgroundPosition,
        label: ''
    };
    switch (idleScreen.volumioBackgroundPosition) {
        case 'top':
            idleScreenUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'left':
            idleScreenUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'bottom':
            idleScreenUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'right':
            idleScreenUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default:
            idleScreenUIConf.content.volumioBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
    }
    idleScreenUIConf.content.volumioBackgroundBlur.value = idleScreen.volumioBackgroundBlur;
    idleScreenUIConf.content.volumioBackgroundScale.value = idleScreen.volumioBackgroundScale;
    if (idleScreen.myBackgroundImageType === 'fixed') {
        if (idleScreenMyBackgroundImage !== '' && !myBackgrounds.find((bg) => bg.name === idleScreenMyBackgroundImage)) {
            idleScreenMyBackgroundImage = ''; // Image no longer exists
        }
        idleScreenUIConf.content.myBackgroundImage.value = {
            value: idleScreenMyBackgroundImage,
            label: idleScreenMyBackgroundImage
        };
    }
    else { // Random
        idleScreenUIConf.content.myBackgroundImage.value = {
            value: '/RANDOM/',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_RANDOM')
        };
    }
    if (myBackgrounds.length > 0) {
        idleScreenUIConf.content.myBackgroundImage.options.push({
            value: '/SEPARATOR/',
            label: '-'.repeat(NowPlayingContext_1.default.getI18n('NOW_PLAYING_RANDOM').length)
        });
        myBackgrounds.forEach((bg) => {
            idleScreenUIConf.content.myBackgroundImage.options.push({
                value: bg.name,
                label: bg.name
            });
        });
    }
    idleScreenUIConf.content.myBackgroundRandomRefreshInterval.value = idleScreen.myBackgroundRandomRefreshInterval;
    idleScreenUIConf.content.myBackgroundFit.value = {
        value: idleScreen.myBackgroundFit,
        label: ''
    };
    switch (idleScreen.myBackgroundFit) {
        case 'contain':
            idleScreenUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_CONTAIN');
            break;
        case 'fill':
            idleScreenUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_FILL');
            break;
        default:
            idleScreenUIConf.content.myBackgroundFit.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_FIT_COVER');
    }
    idleScreenUIConf.content.myBackgroundPosition.value = {
        value: idleScreen.myBackgroundPosition,
        label: ''
    };
    switch (idleScreen.myBackgroundPosition) {
        case 'top':
            idleScreenUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_TOP');
            break;
        case 'left':
            idleScreenUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_LEFT');
            break;
        case 'bottom':
            idleScreenUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_BOTTOM');
            break;
        case 'right':
            idleScreenUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_RIGHT');
            break;
        default:
            idleScreenUIConf.content.myBackgroundPosition.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_POSITION_CENTER');
    }
    idleScreenUIConf.content.myBackgroundBlur.value = idleScreen.myBackgroundBlur;
    idleScreenUIConf.content.myBackgroundScale.value = idleScreen.myBackgroundScale;
    idleScreenUIConf.content.unsplashKeywords.value = idleScreen.unsplashKeywords;
    idleScreenUIConf.content.unsplashKeywordsAppendDayPeriod.value = idleScreen.unsplashKeywordsAppendDayPeriod;
    idleScreenUIConf.content.unsplashMatchScreenSize.value = idleScreen.unsplashMatchScreenSize;
    idleScreenUIConf.content.unsplashRefreshInterval.value = idleScreen.unsplashRefreshInterval;
    idleScreenUIConf.content.unsplashBackgroundBlur.value = idleScreen.unsplashBackgroundBlur;
    idleScreenUIConf.content.backgroundOverlay.value = {
        value: idleScreen.backgroundOverlay,
        label: ''
    };
    switch (idleScreen.backgroundOverlay) {
        case 'customColor':
            idleScreenUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_COLOR');
            break;
        case 'customGradient':
            idleScreenUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
            break;
        case 'none':
            idleScreenUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NONE');
            break;
        default:
            idleScreenUIConf.content.backgroundOverlay.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT');
    }
    idleScreenUIConf.content.backgroundOverlayColor.value = idleScreen.backgroundOverlayColor;
    idleScreenUIConf.content.backgroundOverlayColorOpacity.value = idleScreen.backgroundOverlayColorOpacity;
    idleScreenUIConf.content.backgroundOverlayGradient.value = idleScreen.backgroundOverlayGradient;
    idleScreenUIConf.content.backgroundOverlayGradientOpacity.value = idleScreen.backgroundOverlayGradientOpacity;
    idleScreenUIConf.content.weatherBackground.value = {
        value: idleScreen.weatherBackground,
        label: ''
    };
    switch (idleScreen.weatherBackground) {
        case 'customColor':
            idleScreenUIConf.content.weatherBackground.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_COLOR');
            break;
        case 'customGradient':
            idleScreenUIConf.content.weatherBackground.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
            break;
        case 'none':
            idleScreenUIConf.content.weatherBackground.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_NONE');
            break;
        default:
            idleScreenUIConf.content.weatherBackground.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT');
    }
    idleScreenUIConf.content.weatherBackgroundColor.value = idleScreen.weatherBackgroundColor;
    idleScreenUIConf.content.weatherBackgroundColorOpacity.value = idleScreen.weatherBackgroundColorOpacity;
    idleScreenUIConf.content.weatherBackgroundGradient.value = idleScreen.weatherBackgroundGradient;
    idleScreenUIConf.content.weatherBackgroundGradientOpacity.value = idleScreen.weatherBackgroundGradientOpacity;
    idleScreenUIConf.content.weatherAreaHeightType.value = {
        value: idleScreen.weatherAreaHeightType,
        label: idleScreen.weatherAreaHeightType == 'auto' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_AUTO') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    idleScreenUIConf.content.weatherAreaHeight.value = idleScreen.weatherAreaHeight;
    if (idleScreen.enabled === 'disabled') {
        idleScreenUIConf.content = [idleScreenUIConf.content.enabled];
        if (idleScreenUIConf.saveButton) {
            idleScreenUIConf.saveButton.data = ['enabled'];
        }
    }
    /**
     * Extra Screens conf
     */
    const theme = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Theme);
    extraScreensUIConf.content.theme.value = {
        value: theme.active,
        label: ''
    };
    switch (theme.active) {
        case 'glass':
            extraScreensUIConf.content.theme.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_GLASS');
            break;
        default:
            extraScreensUIConf.content.theme.value.label = NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT');
    }
    /**
     * Kiosk conf
     */
    const kiosk = KioskUtils.checkVolumioKiosk();
    let kioskDesc, kioskButton;
    if (!kiosk.exists) {
        kioskDesc = NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_NOT_FOUND');
    }
    else if (kiosk.display == 'default') {
        kioskDesc = NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_SHOWING_DEFAULT');
        kioskButton = {
            id: 'kioskSetToNowPlaying',
            element: 'button',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_SET_TO_NOW_PLAYING'),
            onClick: {
                type: 'emit',
                message: 'callMethod',
                data: {
                    endpoint: 'user_interface/now_playing',
                    method: 'configureVolumioKiosk',
                    data: {
                        display: 'nowPlaying'
                    }
                }
            }
        };
    }
    else if (kiosk.display == 'nowPlaying') {
        kioskDesc = NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_SHOWING_NOW_PLAYING');
        kioskButton = {
            id: 'kioskRestore',
            element: 'button',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_RESTORE'),
            onClick: {
                type: 'emit',
                message: 'callMethod',
                data: {
                    endpoint: 'user_interface/now_playing',
                    method: 'configureVolumioKiosk',
                    data: {
                        display: 'default'
                    }
                }
            }
        };
    }
    else {
        kioskDesc = NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_SHOWING_UNKNOWN');
        if (KioskUtils.volumioKioskBackupPathExists()) {
            kioskDesc += ` ${NowPlayingContext_1.default.getI18n('NOW_PLAYING_DOC_KIOSK_RESTORE_BAK')}`;
            kioskButton = {
                id: 'kioskRestoreBak',
                element: 'button',
                label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_RESTORE_BAK'),
                onClick: {
                    type: 'emit',
                    message: 'callMethod',
                    data: {
                        endpoint: 'user_interface/now_playing',
                        method: 'restoreVolumioKioskBak'
                    }
                }
            };
        }
    }
    kioskUIConf.description = kioskDesc;
    if (kioskButton) {
        kioskUIConf.content = [kioskButton];
    }
    // Performance conf
    const performanceSettings = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Performance);
    performanceUIConf.content.transitionEffectsKiosk.value = performanceSettings.transitionEffectsKiosk;
    performanceUIConf.content.transitionEffectsOtherDevices.value = performanceSettings.transitionEffectsOtherDevices;
    performanceUIConf.content.unmountScreensOnExit.value = {
        value: performanceSettings.unmountScreensOnExit,
        label: performanceSettings.unmountScreensOnExit == 'default' ? NowPlayingContext_1.default.getI18n('NOW_PLAYING_DEFAULT') : NowPlayingContext_1.default.getI18n('NOW_PLAYING_CUSTOM')
    };
    performanceUIConf.content.unmountNowPlayingScreenOnExit.value = performanceSettings.unmountNowPlayingScreenOnExit;
    performanceUIConf.content.unmountBrowseScreenOnExit.value = performanceSettings.unmountBrowseScreenOnExit;
    performanceUIConf.content.unmountQueueScreenOnExit.value = performanceSettings.unmountQueueScreenOnExit;
    performanceUIConf.content.unmountVolumioScreenOnExit.value = performanceSettings.unmountVolumioScreenOnExit;
    performanceUIConf.content.syncedLyricsDelay.value = UIConfigHelper_1.default.sanitizeNumberInput(performanceSettings.syncedLyricsDelay);
    // Backup Config conf
    const backups = await ConfigBackupHelper_1.default.getBackupNames();
    if (backups.length > 0) {
        const restoreBackupSelect = {
            id: 'previousBackup',
            element: 'select',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_PREVIOUS_BACKUPS'),
            value: {
                value: backups[0],
                label: backups.length === 1 ? backups[0] : NowPlayingContext_1.default.getI18n('NOW_PLAYING_LATEST_BACKUP', backups[0])
            },
            options: backups.map((bak, i) => ({
                value: bak,
                label: backups.length === 1 || i > 0 ? bak : NowPlayingContext_1.default.getI18n('NOW_PLAYING_LATEST_BACKUP', bak)
            }))
        };
        const restoreButtons = backups.map((bak) => ({
            id: `restoreButton-${bak}`,
            element: 'button',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_RESTORE_SELECTED'),
            onClick: {
                type: 'emit',
                message: 'callMethod',
                data: {
                    endpoint: 'user_interface/now_playing',
                    method: 'configRestoreConfigFromBackup',
                    data: {
                        backupName: bak
                    }
                }
            },
            visibleIf: {
                field: 'previousBackup',
                value: bak
            }
        }));
        const deleteButtons = backups.map((bak) => ({
            id: `restoreButton-${bak}`,
            element: 'button',
            label: NowPlayingContext_1.default.getI18n('NOW_PLAYING_DELETE_SELECTED'),
            onClick: {
                type: 'emit',
                message: 'callMethod',
                data: {
                    endpoint: 'user_interface/now_playing',
                    method: 'configDeleteConfigBackup',
                    data: {
                        backupName: bak
                    }
                }
            },
            visibleIf: {
                field: 'previousBackup',
                value: bak
            }
        }));
        backupConfigUIConf.content.unshift(restoreBackupSelect, ...restoreButtons, ...deleteButtons);
    }
    return uiconf;
}, _ControllerNowPlaying_parseConfigSaveData = function _ControllerNowPlaying_parseConfigSaveData(data) {
    const apply = {};
    for (const [key, value] of Object.entries(data)) {
        // Check if dropdown selection
        if (typeof value === 'object' && Reflect.has(value, 'value')) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    return apply;
}, _ControllerNowPlaying_configSaveDockedComponentSettings = function _ControllerNowPlaying_configSaveDockedComponentSettings(data, componentName) {
    const apply = __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_parseConfigSaveData).call(this, data);
    const screen = NowPlayingContext_1.default.getConfigValue('screen.nowPlaying');
    const current = screen[componentName] || {};
    const normalizedCurrent = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.NowPlayingScreen)[componentName];
    const refresh = normalizedCurrent.enabled !== apply.enabled;
    const updated = Object.assign(current, apply);
    screen[componentName] = updated;
    NowPlayingContext_1.default.setConfigValue('screen.nowPlaying', screen);
    NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
    __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.NowPlayingScreen);
    if (refresh) {
        NowPlayingContext_1.default.refreshUIConfig();
    }
}, _ControllerNowPlaying_configureWeatherApi = function _ControllerNowPlaying_configureWeatherApi() {
    const localization = CommonSettingsLoader_1.default.get(now_playing_common_1.CommonSettingsCategory.Localization);
    WeatherAPI_1.default.setConfig({
        coordinates: localization.geoCoordinates,
        units: localization.unitSystem
    });
}, _ControllerNowPlaying_broadcastPluginInfo = function _ControllerNowPlaying_broadcastPluginInfo() {
    const { message, payload } = this.getPluginInfo();
    NowPlayingContext_1.default.broadcastMessage(message, payload);
}, _ControllerNowPlaying_notifyCommonSettingsUpdated = function _ControllerNowPlaying_notifyCommonSettingsUpdated(category) {
    NowPlayingContext_1.default.broadcastMessage('nowPlayingPushSettings', {
        category,
        data: CommonSettingsLoader_1.default.get(category)
    });
}, _ControllerNowPlaying_doOnStart = async function _ControllerNowPlaying_doOnStart() {
    NowPlayingContext_1.default.init(__classPrivateFieldGet(this, _ControllerNowPlaying_context, "f"), __classPrivateFieldGet(this, _ControllerNowPlaying_config, "f"));
    await ConfigUpdater_1.default.checkAndUpdate();
    MetadataAPI_1.default.updateSettings(NowPlayingContext_1.default.getConfigValue('metadataService'));
    __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_configureWeatherApi).call(this);
    // Register language change listener
    __classPrivateFieldSet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_onVolumioLanguageChanged).bind(this), "f");
    __classPrivateFieldGet(this, _ControllerNowPlaying_context, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, "f"));
    await __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_startApp).call(this);
    const display = NowPlayingContext_1.default.getConfigValue('kioskDisplay');
    if (display == 'nowPlaying') {
        const kiosk = KioskUtils.checkVolumioKiosk();
        if (kiosk.exists && kiosk.display == 'default') {
            await KioskUtils.modifyVolumioKioskScript(3000, NowPlayingContext_1.default.getConfigValue('port'));
        }
    }
    MyBackgroundMonitor_1.default.start();
}, _ControllerNowPlaying_doOnStop = async function _ControllerNowPlaying_doOnStop() {
    __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_stopApp).call(this);
    // Remove language change listener (this is hacky but prevents a potential
    // Memory leak)
    if (__classPrivateFieldGet(this, _ControllerNowPlaying_config, "f").callbacks && __classPrivateFieldGet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, "f")) {
        __classPrivateFieldGet(this, _ControllerNowPlaying_config, "f").callbacks.delete('language_code', __classPrivateFieldGet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, "f"));
        __classPrivateFieldSet(this, _ControllerNowPlaying_volumioLanguageChangeCallback, null, "f");
    }
    // If kiosk is set to Now Playing, restore it back to default
    const kiosk = KioskUtils.checkVolumioKiosk();
    if (kiosk.exists && kiosk.display == 'nowPlaying') {
        try {
            await KioskUtils.modifyVolumioKioskScript(NowPlayingContext_1.default.getConfigValue('port'), 3000);
        }
        catch (error) {
            // Do nothing
        }
    }
    await MyBackgroundMonitor_1.default.stop();
    NowPlayingContext_1.default.reset();
}, _ControllerNowPlaying_startApp = async function _ControllerNowPlaying_startApp() {
    try {
        await App.start();
    }
    catch (error) {
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_DAEMON_START_ERR', error.message));
        throw error;
    }
}, _ControllerNowPlaying_stopApp = function _ControllerNowPlaying_stopApp() {
    App.stop();
}, _ControllerNowPlaying_restartApp = function _ControllerNowPlaying_restartApp() {
    __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_stopApp).call(this);
    return __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_startApp).call(this);
}, _ControllerNowPlaying_onVolumioLanguageChanged = function _ControllerNowPlaying_onVolumioLanguageChanged() {
    // Push localization settings
    NowPlayingContext_1.default.getLogger().info('[now-playing] Volumio language changed - pushing localization settings');
    __classPrivateFieldGet(this, _ControllerNowPlaying_instances, "m", _ControllerNowPlaying_notifyCommonSettingsUpdated).call(this, now_playing_common_1.CommonSettingsCategory.Localization);
};
module.exports = ControllerNowPlaying;
//# sourceMappingURL=index.js.map