"use strict";
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
var _ControllerSoundCloud_instances, _ControllerSoundCloud_context, _ControllerSoundCloud_config, _ControllerSoundCloud_commandRouter, _ControllerSoundCloud_browseController, _ControllerSoundCloud_searchController, _ControllerSoundCloud_playController, _ControllerSoundCloud_configGetLocaleOptions, _ControllerSoundCloud_addToBrowseSources;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const SoundCloudContext_1 = __importDefault(require("./lib/SoundCloudContext"));
const BrowseController_1 = __importDefault(require("./lib/controller/browse/BrowseController"));
const SearchController_1 = __importDefault(require("./lib/controller/search/SearchController"));
const PlayController_1 = __importDefault(require("./lib/controller/play/PlayController"));
const Misc_1 = require("./lib/util/Misc");
const locales_json_1 = __importDefault(require("./assets/locales.json"));
const model_1 = __importDefault(require("./lib/model"));
const PluginConfig_1 = require("./lib/PluginConfig");
class ControllerSoundCloud {
    constructor(context) {
        _ControllerSoundCloud_instances.add(this);
        _ControllerSoundCloud_context.set(this, void 0);
        _ControllerSoundCloud_config.set(this, void 0);
        _ControllerSoundCloud_commandRouter.set(this, void 0);
        _ControllerSoundCloud_browseController.set(this, void 0);
        _ControllerSoundCloud_searchController.set(this, void 0);
        _ControllerSoundCloud_playController.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerSoundCloud_context, context, "f");
        __classPrivateFieldSet(this, _ControllerSoundCloud_commandRouter, context.coreCommand, "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const langCode = __classPrivateFieldGet(this, _ControllerSoundCloud_commandRouter, "f").sharedVars.get('language_code');
        __classPrivateFieldGet(this, _ControllerSoundCloud_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`)
            .then((uiconf) => {
            const generalUIConf = uiconf.sections[0];
            const playbackConf = uiconf.sections[1];
            const cacheUIConf = uiconf.sections[2];
            // General
            const localeOptions = __classPrivateFieldGet(this, _ControllerSoundCloud_instances, "m", _ControllerSoundCloud_configGetLocaleOptions).call(this);
            const accessToken = SoundCloudContext_1.default.getConfigValue('accessToken');
            generalUIConf.content[0].value = accessToken;
            generalUIConf.content[2].value = localeOptions.selected;
            generalUIConf.content[2].options = localeOptions.options;
            generalUIConf.content[3].value = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
            generalUIConf.content[4].value = SoundCloudContext_1.default.getConfigValue('itemsPerSection');
            generalUIConf.content[5].value = SoundCloudContext_1.default.getConfigValue('combinedSearchResults');
            generalUIConf.content[6].value = SoundCloudContext_1.default.getConfigValue('loadFullPlaylistAlbum');
            // Playback
            const longStreamFormat = SoundCloudContext_1.default.getConfigValue('longStreamFormat');
            playbackConf.content[0].value = SoundCloudContext_1.default.getConfigValue('skipPreviewTracks');
            playbackConf.content[1].value = SoundCloudContext_1.default.getConfigValue('addPlayedToHistory');
            playbackConf.content[1].hidden = !accessToken;
            playbackConf.content[2].options = [
                {
                    value: PluginConfig_1.LongStreamFormat.Opus,
                    label: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LSF_HLS_OPUS')
                },
                {
                    value: PluginConfig_1.LongStreamFormat.MP3,
                    label: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LSF_HLS_MP3')
                }
            ];
            switch (longStreamFormat) {
                case PluginConfig_1.LongStreamFormat.Opus:
                    playbackConf.content[2].value = playbackConf.content[2].options[0];
                    break;
                case PluginConfig_1.LongStreamFormat.MP3:
                    playbackConf.content[2].value = playbackConf.content[2].options[1];
                    break;
            }
            // Soundcloud-testing
            playbackConf.content[3].value = SoundCloudContext_1.default.getConfigValue('logTranscodings');
            // Cache
            const cacheMaxEntries = SoundCloudContext_1.default.getConfigValue('cacheMaxEntries');
            const cacheTTL = SoundCloudContext_1.default.getConfigValue('cacheTTL');
            const cacheEntryCount = SoundCloudContext_1.default.getCache().getEntryCount();
            cacheUIConf.content[0].value = cacheMaxEntries;
            cacheUIConf.content[1].value = cacheTTL;
            cacheUIConf.description = cacheEntryCount > 0 ? SoundCloudContext_1.default.getI18n('SOUNDCLOUD_CACHE_STATS', cacheEntryCount, Math.round(SoundCloudContext_1.default.getCache().getMemoryUsageInKB()).toLocaleString()) : SoundCloudContext_1.default.getI18n('SOUNDCLOUD_CACHE_EMPTY');
            defer.resolve(uiconf);
        })
            .fail((error) => {
            SoundCloudContext_1.default.getLogger().error(`[soundcloud] getUIConfig(): Cannot populate SoundCloud configuration - ${error}`);
            defer.reject(Error());
        });
        return defer.promise;
    }
    configSaveGeneralSettings(data) {
        const itemsPerPage = parseInt(data['itemsPerPage'], 10);
        const itemsPerSection = parseInt(data['itemsPerSection'], 10);
        const combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
        if (!itemsPerPage) {
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_ERR_ITEMS_PER_PAGE'));
            return;
        }
        if (!itemsPerSection) {
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_ERR_ITEMS_PER_SECTION'));
            return;
        }
        if (!combinedSearchResults) {
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_ERR_COMBINED_SEARCH_RESULTS'));
            return;
        }
        const oldAccessToken = SoundCloudContext_1.default.getConfigValue('accessToken');
        const newAccessToken = data['accessToken'].trim();
        const oldLocale = SoundCloudContext_1.default.getConfigValue('locale');
        const newLocale = data['locale'].value;
        const accessTokenChanged = oldAccessToken !== newAccessToken;
        const localeChanged = oldLocale !== newLocale;
        SoundCloudContext_1.default.setConfigValue('accessToken', newAccessToken);
        SoundCloudContext_1.default.setConfigValue('locale', newLocale);
        SoundCloudContext_1.default.setConfigValue('itemsPerPage', itemsPerPage);
        SoundCloudContext_1.default.setConfigValue('itemsPerSection', itemsPerSection);
        SoundCloudContext_1.default.setConfigValue('combinedSearchResults', combinedSearchResults);
        SoundCloudContext_1.default.setConfigValue('loadFullPlaylistAlbum', !!data['loadFullPlaylistAlbum']);
        if (accessTokenChanged || localeChanged) {
            SoundCloudContext_1.default.getCache().clear();
        }
        if (localeChanged) {
            model_1.default.setLocale(newLocale);
        }
        if (accessTokenChanged) {
            model_1.default.setAccessToken(newAccessToken);
            SoundCloudContext_1.default.refreshUIConfig();
        }
        SoundCloudContext_1.default.toast('success', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
    }
    configSaveCacheSettings(data) {
        const cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
        const cacheTTL = parseInt(data['cacheTTL'], 10);
        if (cacheMaxEntries < 1000) {
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
            return;
        }
        if (cacheTTL < 600) {
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_TTL'));
            return;
        }
        SoundCloudContext_1.default.setConfigValue('cacheMaxEntries', cacheMaxEntries);
        SoundCloudContext_1.default.setConfigValue('cacheTTL', cacheTTL);
        SoundCloudContext_1.default.getCache().setMaxEntries(cacheMaxEntries);
        SoundCloudContext_1.default.getCache().setTTL(cacheTTL);
        SoundCloudContext_1.default.toast('success', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
        SoundCloudContext_1.default.refreshUIConfig();
    }
    configSavePlaybackSettings(data) {
        SoundCloudContext_1.default.setConfigValue('skipPreviewTracks', !!data['skipPreviewTracks']);
        SoundCloudContext_1.default.setConfigValue('addPlayedToHistory', !!data['addPlayedToHistory']);
        // Soundcloud-testing
        SoundCloudContext_1.default.setConfigValue('logTranscodings', !!data['logTranscodings']);
        const longStreamFormat = data['longStreamFormat'].value;
        if (longStreamFormat === PluginConfig_1.LongStreamFormat.Opus || longStreamFormat === PluginConfig_1.LongStreamFormat.MP3) {
            SoundCloudContext_1.default.setConfigValue('longStreamFormat', longStreamFormat);
        }
        SoundCloudContext_1.default.toast('success', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
    }
    configClearCache() {
        SoundCloudContext_1.default.getCache().clear();
        SoundCloudContext_1.default.toast('success', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_CACHE_CLEARED'));
        SoundCloudContext_1.default.refreshUIConfig();
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerSoundCloud_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerSoundCloud_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerSoundCloud_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerSoundCloud_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        SoundCloudContext_1.default.init(__classPrivateFieldGet(this, _ControllerSoundCloud_context, "f"), __classPrivateFieldGet(this, _ControllerSoundCloud_config, "f"));
        __classPrivateFieldSet(this, _ControllerSoundCloud_browseController, new BrowseController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerSoundCloud_searchController, new SearchController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerSoundCloud_playController, new PlayController_1.default(), "f");
        const accessToken = SoundCloudContext_1.default.getConfigValue('accessToken');
        if (accessToken) {
            model_1.default.setAccessToken(accessToken);
        }
        model_1.default.setLocale(SoundCloudContext_1.default.getConfigValue('locale'));
        __classPrivateFieldGet(this, _ControllerSoundCloud_instances, "m", _ControllerSoundCloud_addToBrowseSources).call(this);
        return kew_1.default.resolve();
    }
    onStop() {
        __classPrivateFieldGet(this, _ControllerSoundCloud_commandRouter, "f").volumioRemoveToBrowseSources('SoundCloud');
        __classPrivateFieldSet(this, _ControllerSoundCloud_browseController, null, "f");
        __classPrivateFieldSet(this, _ControllerSoundCloud_searchController, null, "f");
        __classPrivateFieldSet(this, _ControllerSoundCloud_playController, null, "f");
        SoundCloudContext_1.default.reset();
        return kew_1.default.resolve();
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    handleBrowseUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f").browseUri(uri));
    }
    explodeUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f").explodeUri(uri));
    }
    clearAddPlayTrack(track) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").clearAddPlayTrack(track));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").stop();
    }
    pause() {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").pause();
    }
    resume() {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").resume();
    }
    seek(position) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").seek(position);
    }
    next() {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").next();
    }
    previous() {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").previous();
    }
    search(query) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_searchController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        return (0, Misc_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSoundCloud_searchController, "f").search(query));
    }
    goto(data) {
        if (!__classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f")) {
            return kew_1.default.reject('SoundCloud plugin is not started');
        }
        const defer = kew_1.default.defer();
        __classPrivateFieldGet(this, _ControllerSoundCloud_playController, "f").getGotoUri(data.type, data.uri).then((uri) => {
            if (uri) {
                if (!__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f")) {
                    return kew_1.default.reject('SoundCloud plugin is not started');
                }
                defer.resolve(__classPrivateFieldGet(this, _ControllerSoundCloud_browseController, "f").browseUri(uri));
            }
        });
        return defer.promise;
    }
}
_ControllerSoundCloud_context = new WeakMap(), _ControllerSoundCloud_config = new WeakMap(), _ControllerSoundCloud_commandRouter = new WeakMap(), _ControllerSoundCloud_browseController = new WeakMap(), _ControllerSoundCloud_searchController = new WeakMap(), _ControllerSoundCloud_playController = new WeakMap(), _ControllerSoundCloud_instances = new WeakSet(), _ControllerSoundCloud_configGetLocaleOptions = function _ControllerSoundCloud_configGetLocaleOptions() {
    const options = locales_json_1.default.map((data) => ({
        value: data.locale,
        label: data.name
    }));
    const configValue = SoundCloudContext_1.default.getConfigValue('locale');
    const selected = options.find((option) => option.value === configValue);
    return {
        options,
        selected
    };
}, _ControllerSoundCloud_addToBrowseSources = function _ControllerSoundCloud_addToBrowseSources() {
    const source = {
        name: 'SoundCloud',
        uri: 'soundcloud',
        plugin_type: 'music_service',
        plugin_name: 'soundcloud',
        albumart: '/albumart?sourceicon=music_service/soundcloud/dist/assets/images/soundcloud.png'
    };
    __classPrivateFieldGet(this, _ControllerSoundCloud_commandRouter, "f").volumioAddToBrowseSources(source);
};
module.exports = ControllerSoundCloud;
//# sourceMappingURL=index.js.map