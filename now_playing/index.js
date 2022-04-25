'use strict';

const path = require('path');
const geoTZ = require('geo-tz');
global.nowPlayingPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const np = require(nowPlayingPluginLibRoot + '/np');
const util = require(nowPlayingPluginLibRoot + '/util');
const metadata = require(nowPlayingPluginLibRoot + '/api/metadata');
const weather = require(nowPlayingPluginLibRoot + '/api/weather');
const app = require(__dirname + '/app');
const config = require(nowPlayingPluginLibRoot + '/config');

const volumioKioskPath = '/opt/volumiokiosk.sh';
const volumioKioskBackupPath = '/home/volumio/.now_playing/volumiokiosk.sh.bak';
const volumioBackgroundPath = '/data/backgrounds';

module.exports = ControllerNowPlaying;

function ControllerNowPlaying(context) {
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

ControllerNowPlaying.prototype.getUIConfig = function () {
    let self = this;
    let defer = libQ.defer();

    let lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(uiconf => {
            let daemonUIConf = uiconf.sections[0];
            let localizationUIConf = uiconf.sections[1];
            let metadataServiceUIConf = uiconf.sections[2];
            let weatherServiceUIConf = uiconf.sections[3];
            let textStylesUIConf = uiconf.sections[4];
            let widgetStylesUIConf = uiconf.sections[5];
            let albumartStylesUIConf = uiconf.sections[6];
            let backgroundStylesUIConf = uiconf.sections[7];
            let dockedActionPanelTriggerUIConf = uiconf.sections[8];
            let dockedVolumeIndicatorUIConf = uiconf.sections[9];
            let dockedClockUIConf = uiconf.sections[10];
            let dockedWeatherUIConf = uiconf.sections[11];
            let idleScreenUIConf = uiconf.sections[12];
            let extraScreensUIConf = uiconf.sections[13];
            let kioskUIConf = uiconf.sections[14];
            let performanceUIConf = uiconf.sections[15];

            /**
             * Daemon conf
             */
            let port = np.getConfigValue('port', 4004);
            daemonUIConf.content[0].value = port;

            // Get Now Playing Url
            let thisDevice = np.getDeviceInfo();
            let url = `${thisDevice.host}:${port}`;
            let previewUrl = `${url}/preview`
            daemonUIConf.content[1].value = url;
            daemonUIConf.content[2].value = previewUrl;
            daemonUIConf.content[3].onClick.url = previewUrl;

            /**
             * Localization conf
             */
             let localization = config.getLocalizationSettings();

             localizationUIConf.content[0].value = localization.geoCoordinates || '';
             let geoCoordSetupUrl = `${url}/geo_coord_setup`;
             localizationUIConf.content[1].onClick.url = geoCoordSetupUrl;
 
             // Locale list
             let localeList = config.getLocaleList();
             let locale = localization.locale;
             let matchLocale = localeList.find(lc => lc.value === locale);
             if (matchLocale) {
                 localizationUIConf.content[2].value = matchLocale;
             }
             else {
                 localizationUIConf.content[2].value = {
                     value: locale,
                     label: locale
                 }
             }
             localizationUIConf.content[2].options = localeList;
 
             // Timezone list
             let timezoneList = config.getTimezoneList();
             let timezone = localization.timezone;
             let matchTimezone = timezoneList.find(tz => tz.value === timezone);
             if (matchTimezone) {
                 localizationUIConf.content[3].value = matchTimezone;
             }
             else {
                 localizationUIConf.content[3].value = {
                     value: timezone,
                     label: timezone
                 }
             }
             localizationUIConf.content[3].options = timezoneList;
 
             // Unit system
             let unitSystem = localization.unitSystem;
             localizationUIConf.content[4].value = {
                 value: unitSystem
             };
             switch (unitSystem) {
                 case 'imperial':
                     localizationUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_UNITS_IMPERIAL');
                     break;
                 default:
                     localizationUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_UNITS_METRIC');
             }
 
             /**
              * Metadata Service conf
              */
             metadataServiceUIConf.content[0].value = np.getConfigValue('geniusAccessToken', '');
             let accessTokenSetupUrl = `${url}/genius_setup`;
             metadataServiceUIConf.content[1].onClick.url = accessTokenSetupUrl;
 
             /**
              * Weather Service conf
              */
              weatherServiceUIConf.content[0].value = np.getConfigValue('openWeatherMapApiKey', '');
              let apiKeySetupUrl = `${url}/openweathermap_setup`;
              weatherServiceUIConf.content[1].onClick.url = apiKeySetupUrl;
 
            /**
             * Text Styles conf
             */
            let nowPlayingScreenSettings = np.getConfigValue('screen.nowPlaying', {}, true);

            let fontSizes = nowPlayingScreenSettings.fontSizes || 'auto';
            textStylesUIConf.content[0].value = {
                value: fontSizes,
                label: fontSizes == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            textStylesUIConf.content[1].value = nowPlayingScreenSettings.titleFontSize || '';
            textStylesUIConf.content[2].value = nowPlayingScreenSettings.artistFontSize || '';
            textStylesUIConf.content[3].value = nowPlayingScreenSettings.albumFontSize || '';
            textStylesUIConf.content[4].value = nowPlayingScreenSettings.mediaInfoFontSize || '';
            textStylesUIConf.content[5].value = nowPlayingScreenSettings.seekTimeFontSize || '';

            let fontColors = nowPlayingScreenSettings.fontColors || 'default';
            textStylesUIConf.content[6].value = {
                value: fontColors,
                label: fontColors == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            textStylesUIConf.content[7].value = nowPlayingScreenSettings.titleFontColor || '#FFFFFF';
            textStylesUIConf.content[8].value = nowPlayingScreenSettings.artistFontColor || '#CCCCCC';
            textStylesUIConf.content[9].value = nowPlayingScreenSettings.albumFontColor || '#CCCCCC';
            textStylesUIConf.content[10].value = nowPlayingScreenSettings.mediaInfoFontColor || '#CCCCCC';
            textStylesUIConf.content[11].value = nowPlayingScreenSettings.seekTimeFontColor || '#CCCCCC';

            let textMargins = nowPlayingScreenSettings.textMargins || 'auto';
            textStylesUIConf.content[12].value = {
                value: textMargins,
                label: textMargins == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            textStylesUIConf.content[13].value = nowPlayingScreenSettings.titleMargin || '';
            textStylesUIConf.content[14].value = nowPlayingScreenSettings.artistMargin || '';
            textStylesUIConf.content[15].value = nowPlayingScreenSettings.albumMargin || '';
            textStylesUIConf.content[16].value = nowPlayingScreenSettings.mediaInfoMargin || '';

            let textAlignmentH = nowPlayingScreenSettings.textAlignmentH || 'left';
            textStylesUIConf.content[17].value = {
                value: textAlignmentH
            };
            switch (textAlignmentH) {
                case 'center':
                    textStylesUIConf.content[17].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
                    break;
                case 'right':
                    textStylesUIConf.content[17].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:
                    textStylesUIConf.content[17].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
            }

            let textAlignmentV = nowPlayingScreenSettings.textAlignmentV || 'flex-start';
            textStylesUIConf.content[18].value = {
                value: textAlignmentV
            };
            switch (textAlignmentV) {
                case 'center':
                    textStylesUIConf.content[18].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
                    break;
                case 'flex-end':
                    textStylesUIConf.content[18].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                case 'space-between':
                    textStylesUIConf.content[18].value.label = np.getI18n('NOW_PLAYING_SPREAD');
                    break;
                default:
                    textStylesUIConf.content[18].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
            }

            let textAlignmentLyrics = nowPlayingScreenSettings.textAlignmentLyrics || 'center';
            textStylesUIConf.content[19].value = {
                value: textAlignmentLyrics
            };
            switch (textAlignmentLyrics) {
                case 'center':
                    textStylesUIConf.content[19].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
                    break;
                case 'right':
                    textStylesUIConf.content[19].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:
                    textStylesUIConf.content[19].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
            }

            let maxLines = nowPlayingScreenSettings.maxLines || 'auto';
            textStylesUIConf.content[20].value = {
                value: maxLines,
                label: maxLines == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            textStylesUIConf.content[21].value = nowPlayingScreenSettings.maxTitleLines !== undefined ? nowPlayingScreenSettings.maxTitleLines : '';
            textStylesUIConf.content[22].value = nowPlayingScreenSettings.maxArtistLines !== undefined ? nowPlayingScreenSettings.maxArtistLines : '';
            textStylesUIConf.content[23].value = nowPlayingScreenSettings.maxAlbumLines !== undefined ? nowPlayingScreenSettings.maxAlbumLines : '';

            let trackInfoOrder = nowPlayingScreenSettings.trackInfoOrder || 'default';
            textStylesUIConf.content[24].value = {
                value: trackInfoOrder,
                label: trackInfoOrder == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            textStylesUIConf.content[25].value = nowPlayingScreenSettings.trackInfoTitleOrder !== undefined ? nowPlayingScreenSettings.trackInfoTitleOrder : '';
            textStylesUIConf.content[26].value = nowPlayingScreenSettings.trackInfoArtistOrder !== undefined ? nowPlayingScreenSettings.trackInfoArtistOrder : '';
            textStylesUIConf.content[27].value = nowPlayingScreenSettings.trackInfoAlbumOrder !== undefined ? nowPlayingScreenSettings.trackInfoAlbumOrder : '';
            textStylesUIConf.content[28].value = nowPlayingScreenSettings.trackInfoMediaInfoOrder !== undefined ? nowPlayingScreenSettings.trackInfoMediaInfoOrder : '';

            /**
             * Widget Styles conf
             */
            let widgetColors = nowPlayingScreenSettings.widgetColors || 'default';
            widgetStylesUIConf.content[0].value = {
                value: widgetColors,
                label: widgetColors == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            widgetStylesUIConf.content[1].value = nowPlayingScreenSettings.widgetPrimaryColor || '#CCCCCC';
            widgetStylesUIConf.content[2].value = nowPlayingScreenSettings.widgetHighlightColor || '#24A4F3';

            let widgetVisibility = nowPlayingScreenSettings.widgetVisibility || 'default';
            widgetStylesUIConf.content[3].value = {
                value: widgetVisibility,
                label: widgetVisibility == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            let playbackButtonsVisibility = nowPlayingScreenSettings.playbackButtonsVisibility == undefined ? true : nowPlayingScreenSettings.playbackButtonsVisibility;
            let seekbarVisibility = nowPlayingScreenSettings.seekbarVisibility == undefined ? true : nowPlayingScreenSettings.seekbarVisibility;
            widgetStylesUIConf.content[4].value = playbackButtonsVisibility ? true : false;
            widgetStylesUIConf.content[5].value = seekbarVisibility ? true : false;
            let playbackButtonSizeType = nowPlayingScreenSettings.playbackButtonSizeType || 'auto';
            widgetStylesUIConf.content[6].value = {
                value: playbackButtonSizeType,
                label: playbackButtonSizeType == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            widgetStylesUIConf.content[7].value = nowPlayingScreenSettings.playbackButtonSize || '';

            let widgetMargins = nowPlayingScreenSettings.widgetMargins || 'auto';
            widgetStylesUIConf.content[8].value = {
                value: widgetMargins,
                label: widgetMargins == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            widgetStylesUIConf.content[9].value = nowPlayingScreenSettings.playbackButtonsMargin || '';
            widgetStylesUIConf.content[10].value = nowPlayingScreenSettings.seekbarMargin || '';

            /**
             * Albumart Styles conf
             */
            let albumartVisibility = nowPlayingScreenSettings.albumartVisibility == undefined ? true : nowPlayingScreenSettings.albumartVisibility;
            albumartStylesUIConf.content[0].value = albumartVisibility ? true : false;
            let albumartSize = nowPlayingScreenSettings.albumartSize || 'auto';
            albumartStylesUIConf.content[1].value = {
                value: albumartSize,
                label: albumartSize == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            albumartStylesUIConf.content[2].value = nowPlayingScreenSettings.albumartWidth || '';
            albumartStylesUIConf.content[3].value = nowPlayingScreenSettings.albumartHeight || '';

            let albumartFit = nowPlayingScreenSettings.albumartFit || 'cover';
            albumartStylesUIConf.content[4].value = {
                value: albumartFit
            };
            switch (albumartFit) {
                case 'contain':
                    albumartStylesUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_FIT_CONTAIN');
                    break;
                case 'fill':
                    albumartStylesUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_FIT_FILL');
                    break;
                default:
                    albumartStylesUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_FIT_COVER');
            }
            albumartStylesUIConf.content[5].value = nowPlayingScreenSettings.albumartBorder || '';
            albumartStylesUIConf.content[6].value = nowPlayingScreenSettings.albumartBorderRadius || '';
            if (!albumartVisibility) {
                albumartStylesUIConf.content = [albumartStylesUIConf.content[0]];
                albumartStylesUIConf.saveButton.data = ['albumartVisibility'];
            }

            /**
            * Background Styles Conf
            */
            let backgroundSettings = np.getConfigValue('background', {}, true);
            let backgroundType = backgroundSettings.backgroundType || 'default';
            backgroundStylesUIConf.content[0].value = {
                value: backgroundType,
            };
            switch (backgroundType) {
                case 'albumart':
                    backgroundStylesUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_ALBUM_ART');
                    break;
                case 'color':
                    backgroundStylesUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_COLOR');
                    break;
                case 'volumioBackground':
                    backgroundStylesUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_VOLUMIO_BACKGROUND');
                    break;
                default:
                    backgroundStylesUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_DEFAULT');
            }

            backgroundStylesUIConf.content[1].value = backgroundSettings.backgroundColor || '#000000';

            let albumartBackgroundFit = backgroundSettings.albumartBackgroundFit || 'cover';
            backgroundStylesUIConf.content[2].value = {
                value: albumartBackgroundFit
            };
            switch (albumartBackgroundFit) {
                case 'contain':
                    backgroundStylesUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_FIT_CONTAIN');
                    break;
                case 'fill':
                    backgroundStylesUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_FIT_FILL');
                    break;
                default:
                    backgroundStylesUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_FIT_COVER');
            }
            let albumartBackgroundPosition = backgroundSettings.albumartBackgroundPosition || 'center';
            backgroundStylesUIConf.content[3].value = {
                value: albumartBackgroundPosition
            };
            switch (albumartBackgroundPosition) {
                case 'top':
                    backgroundStylesUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                    break;
                case 'left':
                    backgroundStylesUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                    break;
                case 'bottom':
                    backgroundStylesUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                case 'right':
                    backgroundStylesUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:
                    backgroundStylesUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
            }
            backgroundStylesUIConf.content[4].value = backgroundSettings.albumartBackgroundBlur || '';
            backgroundStylesUIConf.content[5].value = backgroundSettings.albumartBackgroundScale || '';

            let volumioBackgrounds = getVolumioBackgrounds();
            let volumioBackgroundImage = backgroundSettings.volumioBackgroundImage || '';
            if (volumioBackgroundImage !== '' && !volumioBackgrounds.includes(volumioBackgroundImage)) {
                volumioBackgroundImage = '';  // img no longer exists
            }
            backgroundStylesUIConf.content[6].value = {
                value: volumioBackgroundImage,
                label: volumioBackgroundImage
            };
            backgroundStylesUIConf.content[6].options = [];
            volumioBackgrounds.forEach(bg => {
                backgroundStylesUIConf.content[6].options.push({
                    value: bg,
                    label: bg
                });
            });
            let volumioBackgroundFit = backgroundSettings.volumioBackgroundFit || 'cover';
            backgroundStylesUIConf.content[7].value = {
                value: volumioBackgroundFit
            };
            switch (volumioBackgroundFit) {
                case 'contain':
                    backgroundStylesUIConf.content[7].value.label = np.getI18n('NOW_PLAYING_FIT_CONTAIN');
                    break;
                case 'fill':
                    backgroundStylesUIConf.content[7].value.label = np.getI18n('NOW_PLAYING_FIT_FILL');
                    break;
                default:
                    backgroundStylesUIConf.content[7].value.label = np.getI18n('NOW_PLAYING_FIT_COVER');
            }
            let volumioBackgroundPosition = backgroundSettings.volumioBackgroundPosition || 'center';
            backgroundStylesUIConf.content[8].value = {
                value: volumioBackgroundPosition
            };
            switch (volumioBackgroundPosition) {
                case 'top':
                    backgroundStylesUIConf.content[8].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                    break;
                case 'left':
                    backgroundStylesUIConf.content[8].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                    break;
                case 'bottom':
                    backgroundStylesUIConf.content[8].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                case 'right':
                    backgroundStylesUIConf.content[8].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:
                    backgroundStylesUIConf.content[8].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
            }
            backgroundStylesUIConf.content[9].value = backgroundSettings.volumioBackgroundBlur || '';
            backgroundStylesUIConf.content[10].value = backgroundSettings.volumioBackgroundScale || '';

            let backgroundOverlay = backgroundSettings.backgroundOverlay || 'default';
            // Revert obsolete value 'custom' to 'default'
            if (backgroundOverlay === 'custom') {
                backgroundOverlay = 'default';
            }
            backgroundStylesUIConf.content[11].value = {
                value: backgroundOverlay
            };
            switch (backgroundOverlay) {
                case 'customColor':
                    backgroundStylesUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_CUSTOM_COLOR');
                    break;
                case 'customGradient':
                    backgroundStylesUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
                    break;
                case 'none':
                    backgroundStylesUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_NONE');
                    break;
                default:
                    backgroundStylesUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_DEFAULT');
            }
            backgroundStylesUIConf.content[12].value = backgroundSettings.backgroundOverlayColor || '#000000';
            backgroundStylesUIConf.content[13].value = backgroundSettings.backgroundOverlayColorOpacity || '';
            backgroundStylesUIConf.content[14].value = backgroundSettings.backgroundOverlayGradient || '';
            backgroundStylesUIConf.content[15].value = backgroundSettings.backgroundOverlayGradientOpacity || '';

            /**
             * Docked Action Panel Trigger
             */
            let dockedActionPanelTrigger = nowPlayingScreenSettings.dockedActionPanelTrigger || {};
            let dockedActionPanelTriggerEnabled = dockedActionPanelTrigger.enabled === undefined ? true : dockedActionPanelTrigger.enabled;
            let dockedActionPanelTrigerIconSettings = dockedActionPanelTrigger.iconSettings || 'default';
            let dockedActionPanelTriggerIconStyle = dockedActionPanelTrigger.iconStyle || 'expand_more';
            dockedActionPanelTriggerUIConf.content[0].value = dockedActionPanelTriggerEnabled ? true : false;
            dockedActionPanelTriggerUIConf.content[1].value = {
                value: dockedActionPanelTrigerIconSettings,
                label: dockedActionPanelTrigerIconSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedActionPanelTriggerUIConf.content[2].value = {
                value: dockedActionPanelTriggerIconStyle
            };
            switch (dockedActionPanelTriggerIconStyle) {
                case 'expand_circle_down':
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_CHEVRON_CIRCLE');
                    break;
                case 'arrow_drop_down':
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_CARET');
                    break;
                case 'arrow_drop_down_circle':
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_CARET_CIRCLE');
                    break;
                case 'arrow_downward':
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_ARROW');
                    break;
                case 'arrow_circle_down':
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_ARROW_CIRCLE');
                    break;
                default:
                    dockedActionPanelTriggerUIConf.content[2].value.label = np.getI18n('NOW_PLAYING_CHEVRON');
            }
            dockedActionPanelTriggerUIConf.content[3].value = dockedActionPanelTrigger.iconSize || '';
            dockedActionPanelTriggerUIConf.content[4].value = dockedActionPanelTrigger.iconColor || '#CCCCCC';
            dockedActionPanelTriggerUIConf.content[5].value = dockedActionPanelTrigger.opacity || '';
            dockedActionPanelTriggerUIConf.content[6].value = dockedActionPanelTrigger.margin || '';
            if (!dockedActionPanelTriggerEnabled) {
                dockedActionPanelTriggerUIConf.content = [dockedActionPanelTriggerUIConf.content[0]];
                dockedActionPanelTriggerUIConf.saveButton.data = ['enabled'];
            }
 
            /**
             * Docked Volume Indicator
             */
            let dockedVolumeIndicator = nowPlayingScreenSettings.dockedVolumeIndicator || {};
            let dockedVolumeIndicatorEnabled = dockedVolumeIndicator.enabled || false;
            let dockedVolumeIndicatorFontSettings = dockedVolumeIndicator.fontSettings || 'default';
            let dockedVolumeIndicatorIconSettings = dockedVolumeIndicator.iconSettings || 'default';
            let dockedvolumeIndicatorPlacement = dockedVolumeIndicator.placement || 'bottom-right';
            dockedVolumeIndicatorUIConf.content[0].value = dockedVolumeIndicatorEnabled ? true : false;
            dockedVolumeIndicatorUIConf.content[1].value = {
                value: dockedvolumeIndicatorPlacement
            };
            switch (dockedvolumeIndicatorPlacement) {
                case 'top-left':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
                    break;
                case 'top':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                    break;
                case 'top-right':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
                    break;
                case 'left':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                    break;
                case 'right':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                case 'bottom-left':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
                    break;
                case 'bottom':
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                default:
                    dockedVolumeIndicatorUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
            }
            dockedVolumeIndicatorUIConf.content[2].value = dockedVolumeIndicator.displayOrder !== undefined ? dockedVolumeIndicator.displayOrder : '';
            dockedVolumeIndicatorUIConf.content[3].value = {
                value: dockedVolumeIndicatorFontSettings,
                label: dockedVolumeIndicatorFontSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedVolumeIndicatorUIConf.content[4].value = dockedVolumeIndicator.fontSize || '';
            dockedVolumeIndicatorUIConf.content[5].value = dockedVolumeIndicator.fontColor || '#CCCCCC';
            dockedVolumeIndicatorUIConf.content[6].value = {
                value: dockedVolumeIndicatorIconSettings,
                label: dockedVolumeIndicatorIconSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedVolumeIndicatorUIConf.content[7].value = dockedVolumeIndicator.iconSize || '';
            dockedVolumeIndicatorUIConf.content[8].value = dockedVolumeIndicator.iconColor || '#CCCCCC';
            dockedVolumeIndicatorUIConf.content[9].value = dockedVolumeIndicator.margin || '';
            if (!dockedVolumeIndicatorEnabled) {
                dockedVolumeIndicatorUIConf.content = [dockedVolumeIndicatorUIConf.content[0]];
                dockedVolumeIndicatorUIConf.saveButton.data = ['enabled'];
            }

            /**
             * Docked Clock
             */
            let dockedClock = nowPlayingScreenSettings.dockedClock || {};
            let dockedClockEnabled = dockedClock.enabled || false;
            let dockedClockPlacement = dockedClock.placement || 'top-left';
            let dockedClockShowInfo = dockedClock.showInfo || 'dateTime';
            let dockedClockFontSettings = dockedClock.fontSettings || 'default';
            let dockedClockDateFormat = dockedClock.dateFormat || 'default';
            let dockedClockYearFormat = dockedClock.yearFormat || 'none';
            let dockedClockMonthFormat = dockedClock.monthFormat || 'short';
            let dockedClockDayFormat = dockedClock.dayFormat || 'numeric';
            let dockedClockDayOfWeekFormat = dockedClock.dayOfWeekFormat || 'none';
            let dockedClockTimeFormat = dockedClock.timeFormat || 'default';
            let dockedClockHourFormat = dockedClock.hourFormat || 'numeric';
            dockedClockUIConf.content[0].value = dockedClockEnabled ? true : false;
            dockedClockUIConf.content[1].value = {
                value: dockedClockPlacement
            };
            switch (dockedClockPlacement) {
                case 'top-left':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
                    break;
                case 'top':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                    break;
                case 'top-right':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
                    break;
                case 'left':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                    break;
                case 'right':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                case 'bottom-left':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
                    break;
                case 'bottom':
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                default:
                    dockedClockUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
            }
            dockedClockUIConf.content[2].value = dockedClock.displayOrder !== undefined ? dockedClock.displayOrder : '';
            dockedClockUIConf.content[3].value = {
                value: dockedClockShowInfo
            };
            switch (dockedClockShowInfo) {
                case 'time':
                    dockedClockUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_TIME_ONLY');
                    break;
                case 'date':
                    dockedClockUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_DATE_ONLY');
                    break;
                default:
                    dockedClockUIConf.content[3].value.label = np.getI18n('NOW_PLAYING_DATE_TIME');
            }
            dockedClockUIConf.content[4].value = {
                value: dockedClockFontSettings,
                label: dockedClockFontSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedClockUIConf.content[5].value = dockedClock.fontSize || '';
            dockedClockUIConf.content[6].value = dockedClock.dateColor || '#CCCCCC';
            dockedClockUIConf.content[7].value = dockedClock.timeColor || '#CCCCCC';
            dockedClockUIConf.content[8].value = {
                value: dockedClockDateFormat,
                label: dockedClockDateFormat == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedClockUIConf.content[9].value = {
                value: dockedClockYearFormat
            };
            switch (dockedClockYearFormat) {
                case 'numeric':
                    dockedClockUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_NUMERIC_YEAR');
                    break;
                case '2-digit':
                    dockedClockUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_2DIGIT_YEAR');
                    break;
                default:
                    dockedClockUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_NONE');
            }
            dockedClockUIConf.content[10].value = {
                value: dockedClockMonthFormat
            };
            switch (dockedClockMonthFormat) {
                case 'numeric':
                    dockedClockUIConf.content[10].value.label = np.getI18n('NOW_PLAYING_NUMERIC_MONTH');
                    break;
                case '2-digit':
                    dockedClockUIConf.content[10].value.label = np.getI18n('NOW_PLAYING_2DIGIT_MONTH');
                    break;
                case 'long':
                    dockedClockUIConf.content[10].value.label = np.getI18n('NOW_PLAYING_LONG_MONTH');
                    break;
                default:
                    dockedClockUIConf.content[10].value.label = np.getI18n('NOW_PLAYING_SHORT_MONTH');
            }
            dockedClockUIConf.content[11].value = {
                value: dockedClockDayFormat
            };
            switch (dockedClockDayFormat) {                   
                case '2-digit':
                    dockedClockUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_2DIGIT_DAY');
                    break;
                default:
                    dockedClockUIConf.content[11].value.label = np.getI18n('NOW_PLAYING_NUMERIC_DAY');
            }
            dockedClockUIConf.content[12].value = {
                value: dockedClockDayOfWeekFormat
            };
            switch (dockedClockDayOfWeekFormat) {
                case 'long':
                    dockedClockUIConf.content[12].value.label = np.getI18n('NOW_PLAYING_LONG_DAY_OF_WEEK');
                    break;
                case 'short':
                    dockedClockUIConf.content[12].value.label = np.getI18n('NOW_PLAYING_SHORT_DAY_OF_WEEK');
                default:
                    dockedClockUIConf.content[12].value.label = np.getI18n('NOW_PLAYING_NONE');
            }
            dockedClockUIConf.content[13].value = {
                value: dockedClockTimeFormat,
                label: dockedClockTimeFormat == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedClockUIConf.content[14].value = {
                value: dockedClockHourFormat
            };
            switch (dockedClockHourFormat) {                   
                case '2-digit':
                    dockedClockUIConf.content[14].value.label = np.getI18n('NOW_PLAYING_2DIGIT_HOUR');
                    break;
                default:
                    dockedClockUIConf.content[14].value.label = np.getI18n('NOW_PLAYING_NUMERIC_HOUR');
            }
            dockedClockUIConf.content[15].value = dockedClock.hour24 || false;
            dockedClockUIConf.content[16].value = dockedClock.showSeconds || false;
            dockedClockUIConf.content[17].value = dockedClock.margin || '';
            if (!dockedClockEnabled) {
                dockedClockUIConf.content = [dockedClockUIConf.content[0]];
                dockedClockUIConf.saveButton.data = ['enabled'];
            }

            /**
             * Docked Weather
             */
             let dockedWeather = nowPlayingScreenSettings.dockedWeather || {};
             let dockedWeatherEnabled = dockedWeather.enabled || false;
             let dockedWeatherPlacement = dockedWeather.placement || 'top-left';
             let dockedWeatherFontSettings = dockedWeather.fontSettings || 'default';
             let dockedWeatherIconSettings = dockedWeather.iconSettings || 'default';
             let dockedWeatherIconStyle = dockedWeather.iconStyle || 'filled';
             dockedWeatherUIConf.content[0].value = dockedWeatherEnabled ? true : false;
             dockedWeatherUIConf.content[1].value = {
                 value: dockedWeatherPlacement
             };
             switch (dockedWeatherPlacement) {
                 case 'top-left':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_LEFT');
                     break;
                 case 'top':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                     break;
                 case 'top-right':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP_RIGHT');
                     break;
                 case 'left':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                     break;
                 case 'right':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                     break;
                 case 'bottom-left':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_LEFT');
                     break;
                 case 'bottom':
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                     break;
                 default:
                     dockedWeatherUIConf.content[1].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM_RIGHT');
             }
             dockedWeatherUIConf.content[2].value = dockedWeather.displayOrder !== undefined ? dockedWeather.displayOrder : '';
             dockedWeatherUIConf.content[3].value = dockedWeather.showHumidity || false;
             dockedWeatherUIConf.content[4].value = dockedWeather.showWindSpeed || false;
             dockedWeatherUIConf.content[5].value = {
                value: dockedWeatherFontSettings,
                label: dockedWeatherFontSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
             dockedWeatherUIConf.content[6].value = dockedWeather.fontSize || '';
             dockedWeatherUIConf.content[7].value = dockedWeather.fontColor || '#CCCCCC';
             dockedWeatherUIConf.content[8].value = {
                value: dockedWeatherIconSettings,
                label: dockedWeatherIconSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            dockedWeatherUIConf.content[9].value = {
                value: dockedWeatherIconStyle
            };
            switch (dockedWeatherIconStyle) {
                case 'outline':
                    dockedWeatherUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_OUTLINE');
                    break;
                case 'mono':
                    dockedWeatherUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_MONOCHROME');
                    break;
                default:
                    dockedWeatherUIConf.content[9].value.label = np.getI18n('NOW_PLAYING_FILLED');
            }
            dockedWeatherUIConf.content[10].value = dockedWeather.iconSize || '';
            dockedWeatherUIConf.content[11].value = dockedWeather.iconMonoColor || '#CCCCCC';
            dockedWeatherUIConf.content[12].value = dockedWeather.iconAnimate || false;
            dockedWeatherUIConf.content[13].value = dockedWeather.margin || '';
            if (!dockedWeatherEnabled) {
                dockedWeatherUIConf.content = [dockedWeatherUIConf.content[0]];
                dockedWeatherUIConf.saveButton.data = ['enabled'];
            }
             
            /**
             * Idle Screen conf
             */
            let idleScreen = np.getConfigValue('screen.idle', {}, true);
            let idleScreenEnabled = idleScreen.enabled || 'kiosk';
            let idleScreenMainAlignment = idleScreen.mainAlignment || 'flex-start';
            let idleScreenTimeFormat = idleScreen.timeFormat || 'default';
            let idleScreenFontSizes = idleScreen.fontSizes || 'auto';
            let idleScreenFontColors = idleScreen.fontColors || 'default';
            let idleScreenWeatherIconSettings = idleScreen.weatherIconSettings || 'default';
            let idleScreenWeatherIconStyle = idleScreen.weatherIconStyle || 'filled';
            let idleScreenBackgroundType = idleScreen.backgroundType || 'unsplash';
            let idleScreenVolumioImage = idleScreen.volumioBackgroundImage || '';
            let idleScreenVolumioBackgroundFit = idleScreen.volumioBackgroundFit || 'cover';
            let idleScreenVolumioBackgroundPosition = idleScreen.volumioBackgroundPosition || 'center';
            let idleScreenBackgroundOverlay = idleScreen.backgroundOverlay || 'default';
            let idleScreenweatherBackground = idleScreen.weatherBackground || 'default';

            idleScreenUIConf.content[0].value = {
                value: idleScreenEnabled
            };
            switch(idleScreenEnabled) {
                case 'all':
                    idleScreenUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_ALL_CLIENTS');
                    break;
                case 'disabled':
                    idleScreenUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_DISABLED');
                    break;
                default:
                    idleScreenUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_KIOSK_ONLY');
                    break;
            }
            idleScreenUIConf.content[1].value = idleScreen.waitTime || 30;
            idleScreenUIConf.content[2].value = idleScreen.showLocation !== undefined ? idleScreen.showLocation : true;
            idleScreenUIConf.content[3].value = idleScreen.showWeather !== undefined ? idleScreen.showWeather : true;
            idleScreenUIConf.content[4].value = {
                value: idleScreenMainAlignment
            };
            switch (idleScreenMainAlignment) {
                case 'center':
                    idleScreenUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
                    break;
                case 'flex-end':
                    idleScreenUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:  // 'flex-start'
                    idleScreenUIConf.content[4].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
            }
            idleScreenUIConf.content[5].value = {
                value: idleScreenTimeFormat,
                label: idleScreenTimeFormat == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            idleScreenUIConf.content[6].value = idleScreen.hour24 ? true : false;
            idleScreenUIConf.content[7].value = idleScreen.showSeconds ? true : false;
            idleScreenUIConf.content[8].value = {
                value: idleScreenFontSizes,
                label: idleScreenFontSizes == 'auto' ? np.getI18n('NOW_PLAYING_AUTO') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            idleScreenUIConf.content[9].value = idleScreen.timeFontSize || '';
            idleScreenUIConf.content[10].value = idleScreen.dateFontSize || '';
            idleScreenUIConf.content[11].value = idleScreen.locationFontSize || '';
            idleScreenUIConf.content[12].value = idleScreen.weatherCurrentBaseFontSize || '';
            idleScreenUIConf.content[13].value = idleScreen.weatherForecastBaseFontSize || '';
            idleScreenUIConf.content[14].value = {
                value: idleScreenFontColors,
                label: idleScreenFontColors == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            idleScreenUIConf.content[15].value = idleScreen.timeColor || '#FFFFFF';
            idleScreenUIConf.content[16].value = idleScreen.dateColor || '#FFFFFF';
            idleScreenUIConf.content[17].value = idleScreen.locationColor || '#FFFFFF';
            idleScreenUIConf.content[18].value = idleScreen.weatherCurrentColor || '#FFFFFF';
            idleScreenUIConf.content[19].value = idleScreen.weatherForecastColor || '#FFFFFF';
            idleScreenUIConf.content[20].value = {
                value: idleScreenWeatherIconSettings,
                label: idleScreenWeatherIconSettings == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            idleScreenUIConf.content[21].value = {
                value: idleScreenWeatherIconStyle
            };
            switch(idleScreenWeatherIconStyle) {
                case 'outline':
                    idleScreenUIConf.content[21].value.label = np.getI18n('NOW_PLAYING_OUTLINE');
                    break;
                case 'mono':
                    idleScreenUIConf.content[21].value.label = np.getI18n('NOW_PLAYING_MONOCHROME');
                    break;
                default:
                    idleScreenUIConf.content[21].value.label = np.getI18n('NOW_PLAYING_FILLED');
                    break;
            }
            idleScreenUIConf.content[22].value = idleScreen.weatherCurrentIconSize || '';
            idleScreenUIConf.content[23].value = idleScreen.weatherForecastIconSize || '';
            idleScreenUIConf.content[24].value = idleScreen.weatherCurrentIconMonoColor || '#FFFFFF';
            idleScreenUIConf.content[25].value = idleScreen.weatherForecastIconMonoColor || '#FFFFFF';
            idleScreenUIConf.content[26].value = idleScreen.weatherCurrentIconAnimate !== undefined ? idleScreen.weatherCurrentIconAnimate : true;
            idleScreenUIConf.content[27].value = {
                value: idleScreenBackgroundType,
            };
            switch (idleScreenBackgroundType) {
                case 'color':
                    idleScreenUIConf.content[27].value.label = np.getI18n('NOW_PLAYING_COLOR');
                    break;
                case 'volumioBackground':
                    idleScreenUIConf.content[27].value.label = np.getI18n('NOW_PLAYING_VOLUMIO_BACKGROUND');
                    break;
                default:
                    idleScreenUIConf.content[27].value.label = np.getI18n('NOW_PLAYING_UNSPLASH');
            }
            idleScreenUIConf.content[28].value = idleScreen.backgroundColor || '#000000';
            if (idleScreenVolumioImage !== '' && !volumioBackgrounds.includes(idleScreenVolumioImage)) {
                idleScreenVolumioImage = '';  // img no longer exists
            }
            idleScreenUIConf.content[29].value = {
                value: idleScreenVolumioImage,
                label: idleScreenVolumioImage
            };
            idleScreenUIConf.content[29].options = [];
            volumioBackgrounds.forEach(bg => {
                idleScreenUIConf.content[29].options.push({
                    value: bg,
                    label: bg
                });
            });
            idleScreenUIConf.content[30].value = {
                value: idleScreenVolumioBackgroundFit
            };
            switch (idleScreenVolumioBackgroundFit) {
                case 'contain':
                    idleScreenUIConf.content[30].value.label = np.getI18n('NOW_PLAYING_FIT_CONTAIN');
                    break;
                case 'fill':
                    idleScreenUIConf.content[30].value.label = np.getI18n('NOW_PLAYING_FIT_FILL');
                    break;
                default:
                    idleScreenUIConf.content[30].value.label = np.getI18n('NOW_PLAYING_FIT_COVER');
            }
            idleScreenUIConf.content[31].value = {
                value: idleScreenVolumioBackgroundPosition
            };
            switch (idleScreenVolumioBackgroundPosition) {
                case 'top':
                    idleScreenUIConf.content[31].value.label = np.getI18n('NOW_PLAYING_POSITION_TOP');
                    break;
                case 'left':
                    idleScreenUIConf.content[31].value.label = np.getI18n('NOW_PLAYING_POSITION_LEFT');
                    break;
                case 'bottom':
                    idleScreenUIConf.content[31].value.label = np.getI18n('NOW_PLAYING_POSITION_BOTTOM');
                    break;
                case 'right':
                    idleScreenUIConf.content[31].value.label = np.getI18n('NOW_PLAYING_POSITION_RIGHT');
                    break;
                default:
                    idleScreenUIConf.content[31].value.label = np.getI18n('NOW_PLAYING_POSITION_CENTER');
            }
            idleScreenUIConf.content[32].value = idleScreen.volumioBackgroundBlur || '';
            idleScreenUIConf.content[33].value = idleScreen.volumioBackgroundScale || '';
            idleScreenUIConf.content[34].value = idleScreen.unsplashKeywords || '';
            idleScreenUIConf.content[35].value = idleScreen.unsplashKeywordsAppendDayPeriod || false;
            idleScreenUIConf.content[36].value = idleScreen.unsplashMatchScreenSize !== undefined ? idleScreen.unsplashMatchScreenSize : true;
            idleScreenUIConf.content[37].value = idleScreen.unsplashRefreshInterval !== undefined ? idleScreen.unsplashRefreshInterval : 10;
            idleScreenUIConf.content[38].value = idleScreen.unsplashBackgroundBlur || '';
            idleScreenUIConf.content[39].value = {
                value: idleScreenBackgroundOverlay
            };
            switch (idleScreenBackgroundOverlay) {
                case 'customColor':
                    idleScreenUIConf.content[39].value.label = np.getI18n('NOW_PLAYING_CUSTOM_COLOR');
                    break;
                case 'customGradient':
                    idleScreenUIConf.content[39].value.label = np.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
                    break;
                case 'none':
                    idleScreenUIConf.content[39].value.label = np.getI18n('NOW_PLAYING_NONE');
                    break;
                default:
                    idleScreenUIConf.content[39].value.label = np.getI18n('NOW_PLAYING_DEFAULT');
            }
            idleScreenUIConf.content[40].value = idleScreen.backgroundOverlayColor || '#000000';
            idleScreenUIConf.content[41].value = idleScreen.backgroundOverlayColorOpacity || '';
            idleScreenUIConf.content[42].value = idleScreen.backgroundOverlayGradient || '';
            idleScreenUIConf.content[43].value = idleScreen.backgroundOverlayGradientOpacity || '';
            idleScreenUIConf.content[44].value = {
                value: idleScreenweatherBackground
            };
            switch (idleScreenweatherBackground) {
                case 'customColor':
                    idleScreenUIConf.content[44].value.label = np.getI18n('NOW_PLAYING_CUSTOM_COLOR');
                    break;
                case 'customGradient':
                    idleScreenUIConf.content[44].value.label = np.getI18n('NOW_PLAYING_CUSTOM_GRADIENT');
                    break;
                case 'none':
                    idleScreenUIConf.content[44].value.label = np.getI18n('NOW_PLAYING_NONE');
                    break;
                default:
                    idleScreenUIConf.content[44].value.label = np.getI18n('NOW_PLAYING_DEFAULT');
            }
            idleScreenUIConf.content[45].value = idleScreen.weatherBackgroundColor || '#000000';
            idleScreenUIConf.content[46].value = idleScreen.weatherBackgroundColorOpacity || '';
            idleScreenUIConf.content[47].value = idleScreen.weatherBackgroundGradient || '';
            idleScreenUIConf.content[48].value = idleScreen.weatherBackgroundGradientOpacity || '';

            if (idleScreenEnabled === 'disabled') {
                idleScreenUIConf.content = [idleScreenUIConf.content[0]];
                idleScreenUIConf.saveButton.data = ['enabled'];
            }

            /**
             * Extra Screens conf
             */
            let theme = np.getConfigValue('theme', 'default');
            extraScreensUIConf.content[0].value = {
                value: theme
            };
            switch (theme) {
                case 'glass':
                    extraScreensUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_GLASS');
                    break;
                default:
                    extraScreensUIConf.content[0].value.label = np.getI18n('NOW_PLAYING_DEFAULT');
            }

            /**
             * Kiosk conf
             */
            let kiosk = checkVolumioKiosk();
            let kioskDesc, kioskButton;
            if (!kiosk.exists) {
                kioskDesc = np.getI18n('NOW_PLAYING_KIOSK_NOT_FOUND');
            }
            else if (kiosk.display == 'default') {
                kioskDesc = np.getI18n('NOW_PLAYING_KIOSK_SHOWING_DEFAULT');
                kioskButton = {
                    id: 'kioskSetToNowPlaying',
                    element: 'button',
                    label: np.getI18n('NOW_PLAYING_KIOSK_SET_TO_NOW_PLAYING'),
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
                kioskDesc = np.getI18n('NOW_PLAYING_KIOSK_SHOWING_NOW_PLAYING');
                kioskButton = {
                    id: 'kioskRestore',
                    element: 'button',
                    label: np.getI18n('NOW_PLAYING_KIOSK_RESTORE'),
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
                kioskDesc = np.getI18n('NOW_PLAYING_KIOSK_SHOWING_UNKNOWN');
                if (util.fileExists(volumioKioskBackupPath)) {
                    kioskDesc += ' ' + np.getI18n('NOW_PLAYING_DOC_KIOSK_RESTORE_BAK');
                    kioskButton = {
                        id: 'kioskRestoreBak',
                        element: 'button',
                        label: np.getI18n('NOW_PLAYING_KIOSK_RESTORE_BAK'),
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
            let performanceSettings = config.getPerformanceSettings();
            performanceUIConf.content[0].value = performanceSettings.transitionEffectsKiosk || false;
            performanceUIConf.content[1].value = performanceSettings.transitionEffectsOtherDevices == undefined ? true : performanceSettings.transitionEffectsOtherDevices;
            let unmountScreensOnExit = performanceSettings.unmountScreensOnExit || 'default';
            performanceUIConf.content[2].value = {
                value: unmountScreensOnExit,
                label: fontColors == 'default' ? np.getI18n('NOW_PLAYING_DEFAULT') : np.getI18n('NOW_PLAYING_CUSTOM')
            };
            performanceUIConf.content[3].value = performanceSettings.unmountNowPlayingScreenOnExit == undefined ? true : performanceSettings.unmountNowPlayingScreenOnExit;
            performanceUIConf.content[4].value = performanceSettings.unmountBrowseScreenOnExit || false;
            performanceUIConf.content[5].value = performanceSettings.unmountQueueScreenOnExit || false;
            performanceUIConf.content[6].value = performanceSettings.unmountVolumioScreenOnExit == undefined ? true : performanceSettings.unmountVolumioScreenOnExit;

            defer.resolve(uiconf);
        })
        .fail(error => {
            np.getLogger().error(np.getErrorMessage('[now-playing] getUIConfig(): Cannot populate Now Playing configuration:', error));
            defer.reject(new Error());
        }
        );

    return defer.promise;
};

ControllerNowPlaying.prototype.configSaveDaemon = function (data) {
    let oldPort = np.getConfigValue('port', 4004);
    let port = parseInt(data['port'], 10);
    if (port < 1024 || port > 65353) {
        np.toast('error', np.getI18n('NOW_PLAYING_INVALID_PORT'));
        return;
    }

    if (oldPort !== port) {
        var modalData = {
            title: np.getI18n('NOW_PLAYING_CONFIGURATION'),
            message: np.getI18n('NOW_PLAYING_CONF_RESTART_CONFIRM'),
            size: 'lg',
            buttons: [
                {
                    name: np.getI18n('NOW_PLAYING_NO'),
                    class: 'btn btn-warning',
                },
                {
                    name: np.getI18n('NOW_PLAYING_YES'),
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
        this.commandRouter.broadcastMessage("openModal", modalData);
    }
    else {
        np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
    }
}

ControllerNowPlaying.prototype.configConfirmSaveDaemon = function (data) {
    let self = this;

    // Obtain kiosk info before saving new port
    let kiosk = checkVolumioKiosk();

    self.config.set('port', data['port']);

    self.restartApp().then(() => {
        np.toast('success', np.getI18n('NOW_PLAYING_RESTARTED'));

        // Update cached plugin info and broadcast it
        np.set('pluginInfo', util.getPluginInfo());
        let bc = self.getPluginInfo();
        np.broadcastMessage(bc.message, bc.payload);

        // Check if kiosk script was set to show Now Playing, and update 
        // to new port (do not restart volumio-kiosk service because 
        // the screen will reload itself when app is started)
        if (kiosk.exists && kiosk.display == 'nowPlaying') {
            self.modifyVolumioKioskScript(data['oldPort'], data['port'], false);
        }

        self.refreshUIConfig();
    })
        .fail(error => {
            self.config.set('port', data['oldPort']);
            self.refreshUIConfig();
        });
}

ControllerNowPlaying.prototype.configSaveTextStyles = function (data) {
    let maxTitleLines = data.maxTitleLines !== '' ? parseInt(data.maxTitleLines, 10) : '';
    let maxArtistLines = data.maxArtistLines !== '' ? parseInt(data.maxArtistLines, 10) : '';
    let maxAlbumLines = data.maxAlbumLines !== '' ? parseInt(data.maxAlbumLines, 10) : '';
    let trackInfoTitleOrder = data.trackInfoTitleOrder !== '' ? parseInt(data.trackInfoTitleOrder, 10) : '';
    let trackInfoArtistOrder = data.trackInfoArtistOrder !== '' ? parseInt(data.trackInfoArtistOrder, 10) : '';
    let trackInfoAlbumOrder = data.trackInfoAlbumOrder !== '' ? parseInt(data.trackInfoAlbumOrder, 10) : '';
    let trackInfoMediaInfoOrder = data.trackInfoMediaInfoOrder !== '' ? parseInt(data.trackInfoMediaInfoOrder, 10) : '';
    let apply = {
        fontSizes: data.fontSizes.value,
        titleFontSize: data.titleFontSize,
        artistFontSize: data.artistFontSize,
        albumFontSize: data.albumFontSize,
        mediaInfoFontSize: data.mediaInfoFontSize,
        seekTimeFontSize: data.seekTimeFontSize,
        fontColors: data.fontColors.value,
        titleFontColor: data.titleFontColor,
        artistFontColor: data.artistFontColor,
        albumFontColor: data.albumFontColor,
        mediaInfoFontColor: data.mediaInfoFontColor,
        seekTimeFontColor: data.seekTimeFontColor,
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
        trackInfoMediaInfoOrder
    };
    let current = np.getConfigValue('screen.nowPlaying', {}, true);
    let updated = Object.assign(current, apply);
    this.config.set('screen.nowPlaying', JSON.stringify(updated));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: updated });
}

ControllerNowPlaying.prototype.configSaveWidgetStyles = function (data) {
    let apply = {
        widgetColors: data.widgetColors.value,
        widgetPrimaryColor: data.widgetPrimaryColor,
        widgetHighlightColor: data.widgetHighlightColor,
        widgetVisibility: data.widgetVisibility.value,
        playbackButtonsVisibility: data.playbackButtonsVisibility,
        seekbarVisibility: data.seekbarVisibility,
        playbackButtonSizeType: data.playbackButtonSizeType.value,
        playbackButtonSize: data.playbackButtonSize,
        widgetMargins: data.widgetMargins.value,
        playbackButtonsMargin: data.playbackButtonsMargin,
        seekbarMargin: data.seekbarMargin
    };
    let current = np.getConfigValue('screen.nowPlaying', {}, true);
    let updated = Object.assign(current, apply);
    this.config.set('screen.nowPlaying', JSON.stringify(updated));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: updated });
}

ControllerNowPlaying.prototype.configSaveAlbumartStyles = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    let current = np.getConfigValue('screen.nowPlaying', {}, true);
    let currentAlbumartVisibility = (current.albumartVisibility == undefined ? true : current.albumartVisibility) ? true : false;
    let refresh = currentAlbumartVisibility !== apply.albumartVisibility;
    let updated = Object.assign(current, apply);
    this.config.set('screen.nowPlaying', JSON.stringify(updated));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: updated });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveBackgroundStyles = function (data) {
    let settings = {
        backgroundType: data.backgroundType.value,
        backgroundColor: data.backgroundColor,
        albumartBackgroundFit: data.albumartBackgroundFit.value,
        albumartBackgroundPosition: data.albumartBackgroundPosition.value,
        albumartBackgroundBlur: data.albumartBackgroundBlur,
        albumartBackgroundScale: data.albumartBackgroundScale,
        volumioBackgroundImage: data.volumioBackgroundImage.value,
        volumioBackgroundFit: data.volumioBackgroundFit.value,
        volumioBackgroundPosition: data.volumioBackgroundPosition.value,
        volumioBackgroundBlur: data.volumioBackgroundBlur,
        volumioBackgroundScale: data.volumioBackgroundScale,
        backgroundOverlay: data.backgroundOverlay.value,
        backgroundOverlayColor: data.backgroundOverlayColor,
        backgroundOverlayColorOpacity: data.backgroundOverlayColorOpacity,
        backgroundOverlayGradient: data.backgroundOverlayGradient,
        backgroundOverlayGradientOpacity: data.backgroundOverlayGradientOpacity
    };
    let current = np.getConfigValue('background', {}, true);
    let updated = Object.assign(current, settings);
    this.config.set('background', JSON.stringify(updated));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'background', data: updated });
}

ControllerNowPlaying.prototype.configSaveDockedActionPanelTriggerSettings = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    let screen = np.getConfigValue('screen.nowPlaying', {}, true);
    let current = screen.dockedActionPanelTrigger || {};
    let currentEnabled = current.enabled !== undefined ? current.enabled : true;
    let refresh = currentEnabled !== apply.enabled;
    let updated = Object.assign(current, apply);
    screen.dockedActionPanelTrigger = updated;
    this.config.set('screen.nowPlaying', JSON.stringify(screen));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: screen });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveDockedVolumeIndicatorSettings = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    let screen = np.getConfigValue('screen.nowPlaying', {}, true);
    let current = screen.dockedVolumeIndicator || {};
    let currentEnabled = current.enabled || false;
    let refresh = currentEnabled !== apply.enabled;
    if (apply.enabled) {
        apply.displayOrder = data.displayOrder !== '' ? parseInt(data.displayOrder, 10) : '';
    }
    let updated = Object.assign(current, apply);
    screen.dockedVolumeIndicator = updated;
    this.config.set('screen.nowPlaying', JSON.stringify(screen));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: screen });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveDockedClockSettings = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    let screen = np.getConfigValue('screen.nowPlaying', {}, true);
    let current = screen.dockedClock || {};
    let currentEnabled = current.enabled || false;
    let refresh = currentEnabled !== apply.enabled;
    if (apply.enabled) {
        apply.displayOrder = data.displayOrder !== '' ? parseInt(data.displayOrder, 10) : '';
    }
    let updated = Object.assign(current, apply);
    screen.dockedClock = updated;
    this.config.set('screen.nowPlaying', JSON.stringify(screen));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: screen });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveDockedWeatherSettings = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    let screen = np.getConfigValue('screen.nowPlaying', {}, true);
    let current = screen.dockedWeather || {};
    let currentEnabled = current.enabled || false;
    let refresh = currentEnabled !== apply.enabled;
    if (apply.enabled) {
        apply.displayOrder = data.displayOrder !== '' ? parseInt(data.displayOrder, 10) : '';
    }
    let updated = Object.assign(current, apply);
    screen.dockedWeather = updated;
    this.config.set('screen.nowPlaying', JSON.stringify(screen));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.nowPlaying', data: screen });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveLocalizationSettings = function(data) {
    let settings = {
        geoCoordinates: data.geoCoordinates,
        locale: data.locale.value,
        timezone: data.timezone.value,
        unitSystem: data.unitSystem.value
    };

    if (settings.locale === 'localeListDivider') {
        np.toast('error', np.getI18n('NOW_PLAYING_LOCALE_SELECTION_INVALID'));
        return;
    }
    if (settings.timezone === 'timezoneListDivider') {
        np.toast('error', np.getI18n('NOW_PLAYING_TIMEZONE_SELECTION_INVALID'));
        return;
    }
    
    let successMessage = np.getI18n('NOW_PLAYING_SETTINGS_SAVED');
    if (settings.timezone === 'matchGeoCoordinates') {
        let coord = config.parseCoordinates(settings.geoCoordinates);
        if (!coord) {
            np.toast('error', np.getI18n('NOW_PLAYING_INVALID_GEO_COORD'));
            return;
        }
        let matchTimezones = geoTZ.find(coord.lat, coord.lon);
        if (Array.isArray(matchTimezones) && matchTimezones.length > 0) {
            settings.geoTimezone = matchTimezones[0];
            successMessage = np.getI18n('NOW_PLAYING_TZ_SET_BY_GEO_COORD', matchTimezones[0]);
        }
        else {
            settings.geoTimezone = null;
            successMessage = null;
            np.toast('warning', np.getI18n('NOW_PLAYING_TZ_BY_GEO_COORD_NOT_FOUND'));
        }
    }
    
    this.config.set('localization', JSON.stringify(settings));
    if (successMessage) {
        np.toast('success', successMessage);
    }

    this.configureWeatherApi();

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'localization', data: config.getLocalizationSettings() });
}

ControllerNowPlaying.prototype.configSaveMetadataServiceSettings = function (data) {
    let token = data['geniusAccessToken'].trim();
    this.config.set('geniusAccessToken', token);
    metadata.setAccessToken(token);
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
}

ControllerNowPlaying.prototype.configSaveWeatherServiceSettings = function (data) {
    let apiKey = data['openWeatherMapApiKey'].trim();
    this.config.set('openWeatherMapApiKey', apiKey);
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));
    this.configureWeatherApi();
}

ControllerNowPlaying.prototype.clearMetadataCache = function () {
    metadata.clearCache();
    np.toast('success', np.getI18n('NOW_PLAYING_CACHE_CLEARED'));
}

ControllerNowPlaying.prototype.clearWeatherCache = function () {
    weather.clearCache();
    np.toast('success', np.getI18n('NOW_PLAYING_CACHE_CLEARED'));
}

ControllerNowPlaying.prototype.configSaveIdleScreenSettings = function (data) {
    let apply = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && value.value !== undefined) {
            apply[key] = value.value;
        }
        else {
            apply[key] = value;
        }
    }
    if (apply.waitTime) {
        apply.waitTime = parseInt(apply.waitTime, 10);
    }
    apply.unsplashRefreshInterval = data.unsplashRefreshInterval ? parseInt(apply.unsplashRefreshInterval, 10) : 10;
    if (apply.waitTime < 10) {
        np.toast('error', np.getI18n('NOW_PLAYING_ERR_IDLE_SCREEN_WAIT_TIME'));
        return;
    }
    if (apply.unsplashRefreshInterval !== 0 && apply.unsplashRefreshInterval < 10) {
        np.toast('error', np.getI18n('NOW_PLAYING_ERR_UNSPLASH_REFRESH_INTERVAL'));
        return;
    }
    let current = np.getConfigValue('screen.idle', {}, true);
    let currentEnabled = current.enabled == undefined ? 'kiosk' : current.enabled;
    let refresh = (currentEnabled !== 'disabled' && apply.enabled === 'disabled') || 
        (currentEnabled === 'disabled' && apply.enabled !== 'disabled');
    let updated = Object.assign(current, apply);
    this.config.set('screen.idle', JSON.stringify(updated));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'screen.idle', data: updated });

    if (refresh) {
        this.refreshUIConfig();
    }
}

ControllerNowPlaying.prototype.configSaveExtraScreenSettings = function (data) {
    let theme = data.theme.value;
    this.config.set('theme', theme);
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'theme', data: theme });
}

ControllerNowPlaying.prototype.configureVolumioKiosk = function (data) {
    let self = this;
    let oldPort, newPort;
    if (data.display == 'nowPlaying') {
        oldPort = 3000;
        newPort = np.getConfigValue('port', 4004);
    }
    else { // display == 'default'
        oldPort = np.getConfigValue('port', 4004);
        newPort = 3000;
    }

    self.modifyVolumioKioskScript(oldPort, newPort).then(() => {
        self.config.set('kioskDisplay', data.display);
    });
    self.refreshUIConfig();
}

ControllerNowPlaying.prototype.restoreVolumioKioskBak = function () {
    if (!util.fileExists(volumioKioskBackupPath)) {
        np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_BAK_NOT_FOUND'));
        return;
    }
    try {
        util.copyFile(volumioKioskBackupPath, volumioKioskPath, { asRoot: true });
        this.restartVolumioKioskService();
    } catch (error) {
        np.getLogger().error(np.getErrorMessage('[now-playing] Error restoring kiosk script from backup: ', error));
        np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_RESTORE_BAK_ERR'));
    }
    this.refreshUIConfig();
}

ControllerNowPlaying.prototype.modifyVolumioKioskScript = function (oldPort, newPort, restartService = true) {
    try {
        if (oldPort == 3000) {
            np.getLogger().info(`[now-playing] Backing up ${volumioKioskPath} to ${volumioKioskBackupPath}`);
            util.copyFile(volumioKioskPath, volumioKioskBackupPath, { createDestDirIfNotExists: true });
        }
        util.replaceInFile(volumioKioskPath, `localhost:${oldPort}`, `localhost:${newPort}`);
        np.toast('success', np.getI18n('NOW_PLAYING_KIOSK_MODIFIED'));
    } catch (error) {
        np.getLogger().error(np.getErrorMessage('[now-playing] Error modifying Volumio Kiosk script:', error));
        np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_MODIFY_ERR'));
        return libQ.reject();
    }

    if (restartService) {
        return this.restartVolumioKioskService();
    }
    else {
        return libQ.resolve();
    }
}

ControllerNowPlaying.prototype.restartVolumioKioskService = function () {
    let defer = libQ.defer();

    // Restart volumio-kiosk service if it is active
    util.isSystemdServiceActive('volumio-kiosk').then(isActive => {
        if (isActive) {
            np.toast('info', 'Restarting Volumio Kiosk service...');
            util.restartSystemdService('volumio-kiosk')
                .then(() => { defer.resolve(); })
                .catch(error => {
                    np.toast('error', 'Failed to restart Volumio Kiosk service.');
                    defer.resolve();
                });
        }
        else {
            defer.resolve();
        }
    })
        .catch(error => {
            defer.resolve();
        });

    return defer.promise;
}

ControllerNowPlaying.prototype.configSavePerformanceSettings = function (data) {
    let performanceSettings = {
        transitionEffectsKiosk: data.transitionEffectsKiosk,
        transitionEffectsOtherDevices: data.transitionEffectsOtherDevices,
        unmountScreensOnExit: data.unmountScreensOnExit.value,
        unmountNowPlayingScreenOnExit: data.unmountNowPlayingScreenOnExit,
        unmountBrowseScreenOnExit: data.unmountBrowseScreenOnExit,
        unmountQueueScreenOnExit: data.unmountQueueScreenOnExit,
        unmountVolumioScreenOnExit: data.unmountVolumioScreenOnExit
    };
    this.config.set('performance', JSON.stringify(performanceSettings));
    np.toast('success', np.getI18n('NOW_PLAYING_SETTINGS_SAVED'));

    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'performance', data: performanceSettings });
}

ControllerNowPlaying.prototype.broadcastRefresh = function () {
    np.broadcastMessage('nowPlayingRefresh');
    np.toast('success', np.getI18n('NOW_PLAYING_BROADCASTED_COMMAND'));
}

// Socket callMethod
ControllerNowPlaying.prototype.getPluginInfo = function () {
    return {
        message: 'nowPlayingPluginInfo',
        payload: np.get('pluginInfo')
    };
}

ControllerNowPlaying.prototype.refreshUIConfig = function () {
    let self = this;

    self.commandRouter.getUIConfigOnPlugin('user_interface', 'now_playing', {}).then(config => {
        self.commandRouter.broadcastMessage('pushUiConfig', config);
    });
}

ControllerNowPlaying.prototype.onVolumioStart = function () {
    let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerNowPlaying.prototype.onStart = function () {
    let self = this;

    np.init(self.context, self.config);
    config.checkConfig();

    metadata.setAccessToken(np.getConfigValue('geniusAccessToken', ''));
    self.configureWeatherApi();

    np.set('pluginInfo', util.getPluginInfo());

    // Register language change listener
    self.volumioLanguageChangeCallback = self.onVolumioLanguageChanged.bind(self);
    self.context.coreCommand.sharedVars.registerCallback('language_code', self.volumioLanguageChangeCallback);

    return self.startApp().then(() => {
        let display = np.getConfigValue('kioskDisplay', 'default');
        if (display == 'nowPlaying') {
            let kiosk = checkVolumioKiosk();
            if (kiosk.exists && kiosk.display == 'default') {
                self.modifyVolumioKioskScript(3000, np.getConfigValue('port', 4004));
            }
        }

        return libQ.resolve();
    });
};

ControllerNowPlaying.prototype.onStop = function () {
    this.stopApp();

    // If kiosk is set to Now Playing, restore it back to default
    let restoreKiosk;
    let kiosk = checkVolumioKiosk();
    if (kiosk.exists && kiosk.display == 'nowPlaying') {
        restoreKiosk = this.modifyVolumioKioskScript(np.getConfigValue('port', 4004), 3000);
    }
    else {
        restoreKiosk = libQ.resolve();
    }

    // Remove language change listener (this is hacky but prevents a potential
    // memory leak)
    if (this.config.callbacks && this.volumioLanguageChangeCallback) {
        this.config.callbacks.delete('language_code', this.volumioLanguageChangeCallback);
    }

    return restoreKiosk.fin(() => {
        np.reset();
    });
};

ControllerNowPlaying.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}

ControllerNowPlaying.prototype.startApp = function () {
    let defer = libQ.defer();

    app.start({
        port: np.getConfigValue('port', 4004)
    })
        .then(() => {
            defer.resolve();
        })
        .catch(error => {
            np.toast('error', np.getI18n('NOW_PLAYING_DAEMON_START_ERR', error.message));
            defer.reject(error);
        });

    return defer.promise;
}

ControllerNowPlaying.prototype.stopApp = function () {
    app.stop();
}

ControllerNowPlaying.prototype.restartApp = function () {
    this.stopApp();
    return this.startApp();
}

ControllerNowPlaying.prototype.onVolumioLanguageChanged = function () {
    // Push localization settings
    np.getLogger().info('[now-playing] Volumio language changed - pushing localization settings');
    np.broadcastMessage('nowPlayingPushSettings', { namespace: 'localization', data: config.getLocalizationSettings() });
}

ControllerNowPlaying.prototype.configureWeatherApi = function () { 
    let localization = config.getLocalizationSettings();
    weather.config({
        apiKey: np.getConfigValue('openWeatherMapApiKey', ''),
        coordinates: localization.geoCoordinates,
        units: localization.unitSystem
    });
}

function checkVolumioKiosk() {
    try {
        if (!util.fileExists(volumioKioskPath)) {
            return {
                exists: false,
            };
        }

        if (util.findInFile(volumioKioskPath, 'localhost:3000')) {
            return {
                exists: true,
                display: 'default'
            };
        }

        if (util.findInFile(volumioKioskPath, `localhost:${np.getConfigValue('port', 4004)}`)) {
            return {
                exists: true,
                display: 'nowPlaying'
            };
        }

        return {
            exists: true,
            display: 'unknown'
        };

    } catch (error) {
        np.getLogger().error(np.getErrorMessage('[now-playing] Error reading Volumio Kiosk script: ', error));
        np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_CHECK_ERR'));
        return {
            exists: false
        };
    }
}

function getVolumioBackgrounds() {
    try {
        return util.readdir(volumioBackgroundPath, 'thumbnail-');
    } catch (error) {
        np.getLogger().error(np.getErrorMessage(`[now-playing] Error getting Volumio backgrounds from ${volumioBackgroundPath}: `, error));
        np.toast('error', np.getI18n('NOW_PLAYING_GET_VOLUMIO_BG_ERR'));
        return [];
    }
}
