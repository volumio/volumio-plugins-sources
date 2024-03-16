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
var _ControllerBandcamp_instances, _ControllerBandcamp_context, _ControllerBandcamp_config, _ControllerBandcamp_commandRouter, _ControllerBandcamp_browseController, _ControllerBandcamp_searchController, _ControllerBandcamp_playController, _ControllerBandcamp_addToBrowseSources;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const BandcampContext_1 = __importDefault(require("./lib/BandcampContext"));
const browse_1 = __importDefault(require("./lib/controller/browse"));
const SearchController_1 = __importDefault(require("./lib/controller/search/SearchController"));
const PlayController_1 = __importDefault(require("./lib/controller/play/PlayController"));
const util_1 = require("./lib/util");
const ViewHelper_1 = __importDefault(require("./lib/controller/browse/view-handlers/ViewHelper"));
const model_1 = __importDefault(require("./lib/model"));
class ControllerBandcamp {
    constructor(context) {
        _ControllerBandcamp_instances.add(this);
        _ControllerBandcamp_context.set(this, void 0);
        _ControllerBandcamp_config.set(this, void 0);
        _ControllerBandcamp_commandRouter.set(this, void 0);
        _ControllerBandcamp_browseController.set(this, void 0);
        _ControllerBandcamp_searchController.set(this, void 0);
        _ControllerBandcamp_playController.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerBandcamp_context, context, "f");
        __classPrivateFieldSet(this, _ControllerBandcamp_commandRouter, context.coreCommand, "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const lang_code = __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").sharedVars.get('language_code');
        const configPrepTasks = [
            __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`)
        ];
        kew_1.default.all(configPrepTasks).then((configParams) => {
            const [uiconf] = configParams;
            const generalUIConf = uiconf.sections[0];
            const myBandcampUIConf = uiconf.sections[1];
            const cacheUIConf = uiconf.sections[2];
            // General
            generalUIConf.content[0].value = BandcampContext_1.default.getConfigValue('itemsPerPage', 47);
            generalUIConf.content[1].value = BandcampContext_1.default.getConfigValue('combinedSearchResults', 17);
            generalUIConf.content[2].value = BandcampContext_1.default.getConfigValue('searchByItemType', true);
            generalUIConf.content[3].value = BandcampContext_1.default.getConfigValue('prefetch', true);
            // My Bandcamp
            const myBandcampType = BandcampContext_1.default.getConfigValue('myBandcampType', 'cookie');
            const myBandcampTypeLabel = myBandcampType === 'cookie' ? BandcampContext_1.default.getI18n('BANDCAMP_COOKIE') : BandcampContext_1.default.getI18n('BANDCAMP_USERNAME');
            myBandcampUIConf.content[0].value = {
                value: myBandcampType,
                label: myBandcampTypeLabel
            };
            myBandcampUIConf.content[1].value = BandcampContext_1.default.getConfigValue('myCookie', '');
            myBandcampUIConf.content[2].value = BandcampContext_1.default.getConfigValue('myUsername', '');
            // Cache
            const cacheMaxEntries = BandcampContext_1.default.getConfigValue('cacheMaxEntries', 5000);
            const cacheTTL = BandcampContext_1.default.getConfigValue('cacheTTL', 1800);
            const cacheEntryCount = BandcampContext_1.default.getCache().getEntryCount();
            cacheUIConf.content[0].value = cacheMaxEntries;
            cacheUIConf.content[1].value = cacheTTL;
            cacheUIConf.description = cacheEntryCount > 0 ? BandcampContext_1.default.getI18n('BANDCAMP_CACHE_STATS', cacheEntryCount, Math.round(BandcampContext_1.default.getCache().getMemoryUsageInKB()).toLocaleString()) : BandcampContext_1.default.getI18n('BANDCAMP_CACHE_EMPTY');
            defer.resolve(uiconf);
        })
            .fail((error) => {
            BandcampContext_1.default.getLogger().error(`[bandcamp] getUIConfig(): Cannot populate Bandcamp configuration - ${error}`);
            defer.reject(new Error());
        });
        return defer.promise;
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").getUIConfigOnPlugin('music_service', 'bandcamp', {}).then((config) => {
            __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").broadcastMessage('pushUiConfig', config);
        });
    }
    configSaveGeneralSettings(data) {
        const itemsPerPage = parseInt(data['itemsPerPage'], 10);
        const combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
        if (!itemsPerPage) {
            BandcampContext_1.default.toast('error', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_ERR_ITEMS_PER_PAGE'));
            return;
        }
        if (!combinedSearchResults) {
            BandcampContext_1.default.toast('error', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_ERR_COMBINED_SEARCH_RESULTS'));
            return;
        }
        BandcampContext_1.default.setConfigValue('itemsPerPage', itemsPerPage);
        BandcampContext_1.default.setConfigValue('combinedSearchResults', combinedSearchResults);
        BandcampContext_1.default.setConfigValue('searchByItemType', data.searchByItemType);
        BandcampContext_1.default.setConfigValue('prefetch', data.prefetch);
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_SAVED'));
    }
    configSaveMyBandcampSettings(data) {
        const oldType = BandcampContext_1.default.getConfigValue('myBandcampType', 'cookie');
        const oldMyCookie = BandcampContext_1.default.getConfigValue('myCookie', '');
        const type = data.myBandcampType.value;
        const myCookie = data.myCookie.trim();
        BandcampContext_1.default.setConfigValue('myBandcampType', type);
        BandcampContext_1.default.setConfigValue('myUsername', data.myUsername.trim());
        BandcampContext_1.default.setConfigValue('myCookie', myCookie);
        if (type === 'cookie') {
            model_1.default.setCookie(myCookie);
        }
        else {
            model_1.default.setCookie();
        }
        if (oldType !== type || (type === 'cookie' && oldMyCookie !== myCookie)) {
            BandcampContext_1.default.getCache().clear();
        }
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_SAVED'));
    }
    configSaveCacheSettings(data) {
        const cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
        const cacheTTL = parseInt(data['cacheTTL'], 10);
        if (cacheMaxEntries < 1000) {
            BandcampContext_1.default.toast('error', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
            return;
        }
        if (cacheTTL < 600) {
            BandcampContext_1.default.toast('error', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_ERR_CACHE_TTL'));
            return;
        }
        BandcampContext_1.default.setConfigValue('cacheMaxEntries', cacheMaxEntries);
        BandcampContext_1.default.setConfigValue('cacheTTL', cacheTTL);
        BandcampContext_1.default.getCache().setMaxEntries(cacheMaxEntries);
        BandcampContext_1.default.getCache().setTTL(cacheTTL);
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_SAVED'));
        this.refreshUIConfig();
    }
    configClearCache() {
        BandcampContext_1.default.getCache().clear();
        model_1.default.clearLibCache();
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_CACHE_CLEARED'));
        this.refreshUIConfig();
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerBandcamp_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerBandcamp_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerBandcamp_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        BandcampContext_1.default.init(__classPrivateFieldGet(this, _ControllerBandcamp_context, "f"), __classPrivateFieldGet(this, _ControllerBandcamp_config, "f"));
        const myBandcampType = BandcampContext_1.default.getConfigValue('myBandcampType', 'cookie');
        if (myBandcampType === 'cookie') {
            const myCookie = BandcampContext_1.default.getConfigValue('myCookie', '');
            if (myCookie) {
                model_1.default.setCookie(myCookie);
            }
        }
        __classPrivateFieldSet(this, _ControllerBandcamp_browseController, new browse_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerBandcamp_searchController, new SearchController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerBandcamp_playController, new PlayController_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerBandcamp_instances, "m", _ControllerBandcamp_addToBrowseSources).call(this);
        return kew_1.default.resolve();
    }
    onStop() {
        __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").volumioRemoveToBrowseSources('Bandcamp Discover');
        __classPrivateFieldSet(this, _ControllerBandcamp_browseController, null, "f");
        __classPrivateFieldSet(this, _ControllerBandcamp_searchController, null, "f");
        __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")?.dispose();
        __classPrivateFieldSet(this, _ControllerBandcamp_playController, null, "f");
        model_1.default.reset();
        BandcampContext_1.default.reset();
        return kew_1.default.resolve();
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    handleBrowseUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f").browseUri(uri));
    }
    explodeUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f").explodeUri(uri));
    }
    clearAddPlayTrack(track) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").clearAddPlayTrack(track));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").stop();
    }
    pause() {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").pause();
    }
    resume() {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").resume();
    }
    seek(position) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").seek(position);
    }
    next() {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").next();
    }
    previous() {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").previous();
    }
    prefetch(track) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerBandcamp_playController, "f").prefetch(track));
    }
    search(query) {
        if (!__classPrivateFieldGet(this, _ControllerBandcamp_searchController, "f")) {
            return kew_1.default.reject('Bandcamp Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerBandcamp_searchController, "f").search(query));
    }
    goto(data) {
        return (0, util_1.jsPromiseToKew)((async () => {
            if (!__classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f")) {
                throw Error('Bandcamp Discover plugin is not started');
            }
            try {
                const views = ViewHelper_1.default.getViewsFromUri(data.uri);
                const trackView = views[1];
                if (!trackView) {
                    return __classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f").browseUri('bandcamp');
                }
                let gotoView;
                if (data.type === 'album' && trackView.albumUrl) {
                    gotoView = {
                        name: 'album',
                        albumUrl: trackView.albumUrl
                    };
                }
                else if (data.type === 'artist' && trackView.artistUrl) {
                    gotoView = {
                        name: 'band',
                        bandUrl: trackView.artistUrl
                    };
                }
                else if (trackView.name === 'show' && trackView.showUrl) {
                    gotoView = {
                        name: 'show',
                        showUrl: trackView.showUrl
                    };
                }
                else if (trackView.name === 'article' && trackView.articleUrl) {
                    gotoView = {
                        name: 'article',
                        articleUrl: trackView.articleUrl
                    };
                }
                else {
                    gotoView = null;
                }
                if (gotoView) {
                    return __classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f").browseUri(`bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(gotoView)}`);
                }
                return __classPrivateFieldGet(this, _ControllerBandcamp_browseController, "f").browseUri('bandcamp');
            }
            catch (error) {
                throw Error(`Failed to fetch requested info: ${error.message}`);
            }
        })());
    }
    saveDefaultDiscoverParams(data) {
        BandcampContext_1.default.setConfigValue('defaultDiscoverParams', data, true);
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_SAVED'));
    }
    saveDefaultArticleCategory(data) {
        BandcampContext_1.default.setConfigValue('defaultArticleCategory', data, true);
        BandcampContext_1.default.toast('success', BandcampContext_1.default.getI18n('BANDCAMP_SETTINGS_SAVED'));
    }
}
_ControllerBandcamp_context = new WeakMap(), _ControllerBandcamp_config = new WeakMap(), _ControllerBandcamp_commandRouter = new WeakMap(), _ControllerBandcamp_browseController = new WeakMap(), _ControllerBandcamp_searchController = new WeakMap(), _ControllerBandcamp_playController = new WeakMap(), _ControllerBandcamp_instances = new WeakSet(), _ControllerBandcamp_addToBrowseSources = function _ControllerBandcamp_addToBrowseSources() {
    const data = {
        name: 'Bandcamp Discover',
        uri: 'bandcamp',
        plugin_type: 'music_service',
        plugin_name: 'bandcamp',
        albumart: '/albumart?sourceicon=music_service/bandcamp/dist/assets/images/bandcamp.png'
    };
    __classPrivateFieldGet(this, _ControllerBandcamp_commandRouter, "f").volumioAddToBrowseSources(data);
};
module.exports = ControllerBandcamp;
//# sourceMappingURL=index.js.map