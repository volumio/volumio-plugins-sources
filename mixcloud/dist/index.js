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
var _ControllerMixcloud_instances, _ControllerMixcloud_context, _ControllerMixcloud_config, _ControllerMixcloud_commandRouter, _ControllerMixcloud_browseController, _ControllerMixcloud_searchController, _ControllerMixcloud_playController, _ControllerMixcloud_addToBrowseSources;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const MixcloudContext_1 = __importDefault(require("./lib/MixcloudContext"));
const browse_1 = __importDefault(require("./lib/controller/browse"));
const SearchController_1 = __importDefault(require("./lib/controller/search/SearchController"));
const PlayController_1 = __importDefault(require("./lib/controller/play/PlayController"));
const util_1 = require("./lib/util");
const ViewHelper_1 = __importDefault(require("./lib/controller/browse/view-handlers/ViewHelper"));
const model_1 = __importDefault(require("./lib/model"));
class ControllerMixcloud {
    constructor(context) {
        _ControllerMixcloud_instances.add(this);
        _ControllerMixcloud_context.set(this, void 0);
        _ControllerMixcloud_config.set(this, void 0);
        _ControllerMixcloud_commandRouter.set(this, void 0);
        _ControllerMixcloud_browseController.set(this, void 0);
        _ControllerMixcloud_searchController.set(this, void 0);
        _ControllerMixcloud_playController.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerMixcloud_context, context, "f");
        __classPrivateFieldSet(this, _ControllerMixcloud_commandRouter, context.coreCommand, "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const lang_code = __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").sharedVars.get('language_code');
        const configPrepTasks = [
            __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`)
        ];
        kew_1.default.all(configPrepTasks).then((configParams) => {
            const [uiconf] = configParams;
            const generalUIConf = uiconf.sections[0];
            const cacheUIConf = uiconf.sections[1];
            // General
            generalUIConf.content[0].value = MixcloudContext_1.default.getConfigValue('itemsPerPage');
            generalUIConf.content[1].value = MixcloudContext_1.default.getConfigValue('itemsPerSection');
            // Cache
            const cacheMaxEntries = MixcloudContext_1.default.getConfigValue('cacheMaxEntries');
            const cacheTTL = MixcloudContext_1.default.getConfigValue('cacheTTL');
            const cacheEntryCount = MixcloudContext_1.default.getCache().getEntryCount();
            cacheUIConf.content[0].value = cacheMaxEntries;
            cacheUIConf.content[1].value = cacheTTL;
            cacheUIConf.description = cacheEntryCount > 0 ? MixcloudContext_1.default.getI18n('MIXCLOUD_CACHE_STATS', cacheEntryCount, Math.round(MixcloudContext_1.default.getCache().getMemoryUsageInKB()).toLocaleString()) : MixcloudContext_1.default.getI18n('MIXCLOUD_CACHE_EMPTY');
            defer.resolve(uiconf);
        })
            .fail((error) => {
            MixcloudContext_1.default.getLogger().error(`[mixcloud] getUIConfig(): Cannot populate Mixcloud configuration - ${error}`);
            defer.reject(new Error());
        });
        return defer.promise;
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").getUIConfigOnPlugin('music_service', 'mixcloud', {}).then((config) => {
            __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").broadcastMessage('pushUiConfig', config);
        });
    }
    configSaveGeneralSettings(data) {
        const itemsPerPage = parseInt(data.itemsPerPage, 10);
        const itemsPerSection = parseInt(data.itemsPerSection, 10);
        if (!itemsPerPage) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_PAGE'));
            return;
        }
        if (!itemsPerSection) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_SECTION'));
            return;
        }
        MixcloudContext_1.default.setConfigValue('itemsPerPage', itemsPerPage);
        MixcloudContext_1.default.setConfigValue('itemsPerSection', itemsPerSection);
        MixcloudContext_1.default.toast('success', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_SAVED'));
    }
    configSaveCacheSettings(data) {
        const cacheMaxEntries = parseInt(data.cacheMaxEntries, 10);
        const cacheTTL = parseInt(data.cacheTTL, 10);
        if (cacheMaxEntries < 1000) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
            return;
        }
        if (cacheTTL < 600) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_TTL'));
            return;
        }
        MixcloudContext_1.default.setConfigValue('cacheMaxEntries', cacheMaxEntries);
        MixcloudContext_1.default.setConfigValue('cacheTTL', cacheTTL);
        MixcloudContext_1.default.getCache().setMaxEntries(cacheMaxEntries);
        MixcloudContext_1.default.getCache().setTTL(cacheTTL);
        MixcloudContext_1.default.toast('success', MixcloudContext_1.default.getI18n('MIXCLOUD_SETTINGS_SAVED'));
        this.refreshUIConfig();
    }
    configClearCache() {
        MixcloudContext_1.default.getCache().clear();
        model_1.default.clearLibCache();
        MixcloudContext_1.default.toast('success', MixcloudContext_1.default.getI18n('MIXCLOUD_CACHE_CLEARED'));
        this.refreshUIConfig();
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerMixcloud_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerMixcloud_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerMixcloud_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        MixcloudContext_1.default.init(__classPrivateFieldGet(this, _ControllerMixcloud_context, "f"), __classPrivateFieldGet(this, _ControllerMixcloud_config, "f"));
        __classPrivateFieldSet(this, _ControllerMixcloud_browseController, new browse_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerMixcloud_searchController, new SearchController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerMixcloud_playController, new PlayController_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerMixcloud_instances, "m", _ControllerMixcloud_addToBrowseSources).call(this);
        return kew_1.default.resolve();
    }
    onStop() {
        __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").volumioRemoveToBrowseSources('Mixcloud');
        __classPrivateFieldSet(this, _ControllerMixcloud_browseController, null, "f");
        __classPrivateFieldSet(this, _ControllerMixcloud_searchController, null, "f");
        __classPrivateFieldSet(this, _ControllerMixcloud_playController, null, "f");
        model_1.default.reset();
        MixcloudContext_1.default.reset();
        return kew_1.default.resolve();
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    handleBrowseUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f").browseUri(uri));
    }
    explodeUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f").explodeUri(uri));
    }
    clearAddPlayTrack(track) {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").clearAddPlayTrack(track));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").stop();
    }
    pause() {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").pause();
    }
    resume() {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").resume();
    }
    seek(position) {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").seek(position);
    }
    next() {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").next();
    }
    previous() {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_playController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerMixcloud_playController, "f").previous();
    }
    search(query) {
        if (!__classPrivateFieldGet(this, _ControllerMixcloud_searchController, "f")) {
            return kew_1.default.reject('Mixcloud plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerMixcloud_searchController, "f").search(query));
    }
    goto(data) {
        return (0, util_1.jsPromiseToKew)((async () => {
            if (!__classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f")) {
                throw Error('Mixcloud plugin is not started');
            }
            try {
                const views = ViewHelper_1.default.getViewsFromUri(data.uri);
                const trackView = views.pop();
                if (trackView && data.type === 'artist') {
                    let username = null;
                    if (trackView.name === 'cloudcast' && trackView.owner) {
                        username = trackView.owner;
                    }
                    else if (trackView.name === 'liveStream' && trackView.username) {
                        username = trackView.username;
                    }
                    if (username) {
                        const userView = {
                            name: 'user',
                            username
                        };
                        return __classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f").browseUri(`mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`);
                    }
                }
                return __classPrivateFieldGet(this, _ControllerMixcloud_browseController, "f").browseUri('mixcloud');
            }
            catch (error) {
                throw Error(`Failed to fetch requested info: ${error.message}`);
            }
        })());
    }
}
_ControllerMixcloud_context = new WeakMap(), _ControllerMixcloud_config = new WeakMap(), _ControllerMixcloud_commandRouter = new WeakMap(), _ControllerMixcloud_browseController = new WeakMap(), _ControllerMixcloud_searchController = new WeakMap(), _ControllerMixcloud_playController = new WeakMap(), _ControllerMixcloud_instances = new WeakSet(), _ControllerMixcloud_addToBrowseSources = function _ControllerMixcloud_addToBrowseSources() {
    const data = {
        name: 'Mixcloud',
        uri: 'mixcloud',
        plugin_type: 'music_service',
        plugin_name: 'mixcloud',
        albumart: '/albumart?sourceicon=music_service/mixcloud/dist/assets/images/mixcloud.png'
    };
    __classPrivateFieldGet(this, _ControllerMixcloud_commandRouter, "f").volumioAddToBrowseSources(data);
};
module.exports = ControllerMixcloud;
//# sourceMappingURL=index.js.map