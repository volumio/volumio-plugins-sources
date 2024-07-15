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
var _ControllerYouTube2_instances, _ControllerYouTube2_context, _ControllerYouTube2_config, _ControllerYouTube2_commandRouter, _ControllerYouTube2_browseController, _ControllerYouTube2_searchController, _ControllerYouTube2_playController, _ControllerYouTube2_nowPlayingMetadataProvider, _ControllerYouTube2_getConfigI18nOptions, _ControllerYouTube2_getConfigAccountInfo, _ControllerYouTube2_getAuthStatus, _ControllerYouTube2_configCheckAutoplay, _ControllerYouTube2_addToBrowseSources;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const YouTube2Context_1 = __importDefault(require("./lib/YouTube2Context"));
const browse_1 = __importDefault(require("./lib/controller/browse"));
const SearchController_1 = __importDefault(require("./lib/controller/search/SearchController"));
const PlayController_1 = __importDefault(require("./lib/controller/play/PlayController"));
const util_1 = require("./lib/util");
const Auth_1 = require("./lib/util/Auth");
const model_1 = __importStar(require("./lib/model"));
const ViewHelper_1 = __importDefault(require("./lib/controller/browse/view-handlers/ViewHelper"));
const InnertubeLoader_1 = __importDefault(require("./lib/model/InnertubeLoader"));
const YouTube2NowPlayingMetadataProvider_1 = __importDefault(require("./lib/util/YouTube2NowPlayingMetadataProvider"));
class ControllerYouTube2 {
    constructor(context) {
        _ControllerYouTube2_instances.add(this);
        _ControllerYouTube2_context.set(this, void 0);
        _ControllerYouTube2_config.set(this, void 0);
        _ControllerYouTube2_commandRouter.set(this, void 0);
        _ControllerYouTube2_browseController.set(this, void 0);
        _ControllerYouTube2_searchController.set(this, void 0);
        _ControllerYouTube2_playController.set(this, void 0);
        _ControllerYouTube2_nowPlayingMetadataProvider.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerYouTube2_context, context, "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_commandRouter, context.coreCommand, "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const langCode = __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").sharedVars.get('language_code');
        const loadConfigPromises = [
            __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`),
            __classPrivateFieldGet(this, _ControllerYouTube2_instances, "m", _ControllerYouTube2_getConfigI18nOptions).call(this),
            __classPrivateFieldGet(this, _ControllerYouTube2_instances, "m", _ControllerYouTube2_getConfigAccountInfo).call(this),
            __classPrivateFieldGet(this, _ControllerYouTube2_instances, "m", _ControllerYouTube2_getAuthStatus).call(this)
        ];
        const configModel = model_1.default.getInstance(model_1.ModelType.Config);
        kew_1.default.all(loadConfigPromises)
            .then(([uiconf, i18nOptions, account, authStatus]) => {
            const i18nUIConf = uiconf.sections[0];
            const accountUIConf = uiconf.sections[1];
            const browseUIConf = uiconf.sections[2];
            const playbackUIConf = uiconf.sections[3];
            const ytPlaybackModeConf = uiconf.sections[4];
            // I18n
            // -- region
            i18nUIConf.content[0].label = i18nOptions.options.region.label;
            i18nUIConf.content[0].options = i18nOptions.options.region.optionValues;
            i18nUIConf.content[0].value = i18nOptions.selected.region;
            i18nUIConf.content[1].label = i18nOptions.options.language.label;
            i18nUIConf.content[1].options = i18nOptions.options.language.optionValues;
            i18nUIConf.content[1].value = i18nOptions.selected.language;
            // Account
            let authStatusDescription;
            switch (authStatus.status) {
                case Auth_1.AuthStatus.SignedIn:
                    if (account) {
                        authStatusDescription = YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN_AS', account.name);
                    }
                    else {
                        authStatusDescription = YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN');
                    }
                    break;
                case Auth_1.AuthStatus.SigningIn:
                    authStatusDescription = YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_SIGNING_IN');
                    break;
                case Auth_1.AuthStatus.Error:
                    authStatusDescription = YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_ERROR', YouTube2Context_1.default.getErrorMessage('', authStatus.error, false));
                    break;
                default: // AuthStatus.SignedOut
                    authStatusDescription = YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_OUT');
            }
            if (authStatus.status === Auth_1.AuthStatus.SignedOut) {
                if (authStatus.verificationInfo) {
                    authStatusDescription += ` ${YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_CODE_READY')}`;
                    accountUIConf.content = [
                        {
                            id: 'verificationUrl',
                            type: 'text',
                            element: 'input',
                            label: YouTube2Context_1.default.getI18n('YOUTUBE2_VERIFICATION_URL'),
                            value: authStatus.verificationInfo.verificationUrl
                        },
                        {
                            id: 'openVerificationUrl',
                            element: 'button',
                            label: YouTube2Context_1.default.getI18n('YOUTUBE2_GO_TO_VERIFICATION_URL'),
                            onClick: {
                                type: 'openUrl',
                                url: authStatus.verificationInfo.verificationUrl
                            }
                        },
                        {
                            id: 'code',
                            type: 'text',
                            element: 'input',
                            label: YouTube2Context_1.default.getI18n('YOUTUBE2_DEVICE_CODE'),
                            value: authStatus.verificationInfo.userCode
                        }
                    ];
                }
                else {
                    authStatusDescription += ` ${YouTube2Context_1.default.getI18n('YOUTUBE2_AUTH_STATUS_CODE_PENDING')}`;
                }
            }
            else if (authStatus.status === Auth_1.AuthStatus.SignedIn) {
                accountUIConf.content = [
                    {
                        id: 'signOut',
                        element: 'button',
                        label: YouTube2Context_1.default.getI18n('YOUTUBE2_SIGN_OUT'),
                        onClick: {
                            type: 'emit',
                            message: 'callMethod',
                            data: {
                                endpoint: 'music_service/youtube2',
                                method: 'configSignOut'
                            }
                        }
                    }
                ];
            }
            accountUIConf.description = authStatusDescription;
            // Browse
            const rootContentType = YouTube2Context_1.default.getConfigValue('rootContentType');
            const rootContentTypeOptions = configModel.getRootContentTypeOptions();
            const loadFullPlaylists = YouTube2Context_1.default.getConfigValue('loadFullPlaylists');
            browseUIConf.content[0].options = rootContentTypeOptions;
            browseUIConf.content[0].value = rootContentTypeOptions.find((o) => o.value === rootContentType);
            browseUIConf.content[1].value = loadFullPlaylists;
            // Playback
            const autoplay = YouTube2Context_1.default.getConfigValue('autoplay');
            const autoplayClearQueue = YouTube2Context_1.default.getConfigValue('autoplayClearQueue');
            const autoplayPrefMixRelated = YouTube2Context_1.default.getConfigValue('autoplayPrefMixRelated');
            const addToHistory = YouTube2Context_1.default.getConfigValue('addToHistory');
            const liveStreamQuality = YouTube2Context_1.default.getConfigValue('liveStreamQuality');
            const liveStreamQualityOptions = configModel.getLiveStreamQualityOptions();
            const prefetchEnabled = YouTube2Context_1.default.getConfigValue('prefetch');
            playbackUIConf.content[0].value = autoplay;
            playbackUIConf.content[1].value = autoplayClearQueue;
            playbackUIConf.content[2].value = autoplayPrefMixRelated;
            playbackUIConf.content[3].value = addToHistory;
            playbackUIConf.content[4].options = liveStreamQualityOptions;
            playbackUIConf.content[4].value = liveStreamQualityOptions.find((o) => o.value === liveStreamQuality);
            playbackUIConf.content[5].value = prefetchEnabled;
            // YouTube Playback Mode
            const ytPlaybackMode = YouTube2Context_1.default.getConfigValue('ytPlaybackMode');
            ytPlaybackModeConf.content[0].value = ytPlaybackMode.feedVideos;
            ytPlaybackModeConf.content[1].value = ytPlaybackMode.playlistVideos;
            defer.resolve(uiconf);
        })
            .fail((error) => {
            YouTube2Context_1.default.getLogger().error(`[youtube2] getUIConfig(): Cannot populate YouTube2 configuration - ${error}`);
            defer.reject(Error());
        });
        return defer.promise;
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerYouTube2_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerYouTube2_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerYouTube2_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        YouTube2Context_1.default.init(__classPrivateFieldGet(this, _ControllerYouTube2_context, "f"), __classPrivateFieldGet(this, _ControllerYouTube2_config, "f"));
        __classPrivateFieldSet(this, _ControllerYouTube2_browseController, new browse_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_searchController, new SearchController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_playController, new PlayController_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_nowPlayingMetadataProvider, new YouTube2NowPlayingMetadataProvider_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerYouTube2_instances, "m", _ControllerYouTube2_addToBrowseSources).call(this);
        return kew_1.default.resolve();
    }
    onStop() {
        __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").volumioRemoveToBrowseSources('YouTube2');
        __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")?.reset();
        __classPrivateFieldSet(this, _ControllerYouTube2_browseController, null, "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_searchController, null, "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_playController, null, "f");
        __classPrivateFieldSet(this, _ControllerYouTube2_nowPlayingMetadataProvider, null, "f");
        InnertubeLoader_1.default.reset();
        YouTube2Context_1.default.reset();
        return kew_1.default.resolve();
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    configSaveI18n(data) {
        const oldRegion = YouTube2Context_1.default.hasConfigKey('region') ? YouTube2Context_1.default.getConfigValue('region') : null;
        const oldLanguage = YouTube2Context_1.default.hasConfigKey('language') ? YouTube2Context_1.default.getConfigValue('language') : null;
        const region = data.region.value;
        const language = data.language.value;
        if (oldRegion !== region || oldLanguage !== language) {
            YouTube2Context_1.default.setConfigValue('region', region);
            YouTube2Context_1.default.setConfigValue('language', language);
            InnertubeLoader_1.default.applyI18nConfig();
            model_1.default.getInstance(model_1.ModelType.Config).clearCache();
            YouTube2Context_1.default.refreshUIConfig();
        }
        YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    }
    async configSignOut() {
        if (InnertubeLoader_1.default.hasInstance()) {
            const { auth } = await InnertubeLoader_1.default.getInstance();
            auth.signOut();
        }
    }
    configSaveBrowse(data) {
        YouTube2Context_1.default.setConfigValue('rootContentType', data.rootContentType.value);
        YouTube2Context_1.default.setConfigValue('loadFullPlaylists', data.loadFullPlaylists);
        YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    }
    configSavePlayback(data) {
        YouTube2Context_1.default.setConfigValue('autoplay', data.autoplay);
        YouTube2Context_1.default.setConfigValue('autoplayClearQueue', data.autoplayClearQueue);
        YouTube2Context_1.default.setConfigValue('autoplayPrefMixRelated', data.autoplayPrefMixRelated);
        YouTube2Context_1.default.setConfigValue('addToHistory', data.addToHistory);
        YouTube2Context_1.default.setConfigValue('liveStreamQuality', data.liveStreamQuality.value);
        YouTube2Context_1.default.setConfigValue('prefetch', data.prefetch);
        YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SETTINGS_SAVED'));
        __classPrivateFieldGet(this, _ControllerYouTube2_instances, "m", _ControllerYouTube2_configCheckAutoplay).call(this);
    }
    configEnableAddToHistory() {
        YouTube2Context_1.default.setConfigValue('addToHistory', true);
        YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SETTINGS_SAVED'));
        YouTube2Context_1.default.refreshUIConfig();
    }
    configSaveYouTubePlaybackMode(data) {
        YouTube2Context_1.default.setConfigValue('ytPlaybackMode', {
            feedVideos: data.feedVideos,
            playlistVideos: data.playlistVideos
        });
        YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    }
    handleBrowseUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f").browseUri(uri));
    }
    explodeUri(uri) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f")) {
            return kew_1.default.reject('YouTube2 Discover plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f").explodeUri(uri));
    }
    clearAddPlayTrack(track) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").clearAddPlayTrack(track));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").stop();
    }
    pause() {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").pause();
    }
    resume() {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").resume();
    }
    seek(position) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").seek(position);
    }
    next() {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").next();
    }
    previous() {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").previous();
    }
    prefetch(track) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").prefetch(track));
    }
    search(query) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_searchController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerYouTube2_searchController, "f").search(query));
    }
    goto(data) {
        if (!__classPrivateFieldGet(this, _ControllerYouTube2_playController, "f")) {
            return kew_1.default.reject('YouTube2 plugin is not started');
        }
        const defer = kew_1.default.defer();
        __classPrivateFieldGet(this, _ControllerYouTube2_playController, "f").getGotoUri(data.type, data.uri).then((uri) => {
            if (uri) {
                if (!__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f")) {
                    return kew_1.default.reject('YouTube2 plugin is not started');
                }
                defer.resolve(__classPrivateFieldGet(this, _ControllerYouTube2_browseController, "f").browseUri(uri));
            }
            else {
                const view = ViewHelper_1.default.getViewsFromUri(data.uri)?.[1];
                const trackData = view?.explodeTrackData || null;
                const trackTitle = trackData?.title;
                let errMsg;
                if (data.type === 'album') {
                    errMsg = trackTitle ? YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_GOTO_PLAYLIST_NOT_FOUND_FOR', trackTitle) :
                        YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_GOTO_PLAYLIST_NOT_FOUND');
                }
                else if (data.type === 'artist') {
                    errMsg = trackTitle ? YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_GOTO_CHANNEL_NOT_FOUND_FOR', trackTitle) :
                        YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_GOTO_CHANNEL_NOT_FOUND');
                }
                else {
                    errMsg = YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_GOTO_UNKNOWN_TYPE', data.type);
                }
                YouTube2Context_1.default.toast('error', errMsg);
                defer.reject(Error(errMsg));
            }
        });
        return defer.promise;
    }
    getNowPlayingMetadataProvider() {
        return __classPrivateFieldGet(this, _ControllerYouTube2_nowPlayingMetadataProvider, "f");
    }
}
_ControllerYouTube2_context = new WeakMap(), _ControllerYouTube2_config = new WeakMap(), _ControllerYouTube2_commandRouter = new WeakMap(), _ControllerYouTube2_browseController = new WeakMap(), _ControllerYouTube2_searchController = new WeakMap(), _ControllerYouTube2_playController = new WeakMap(), _ControllerYouTube2_nowPlayingMetadataProvider = new WeakMap(), _ControllerYouTube2_instances = new WeakSet(), _ControllerYouTube2_getConfigI18nOptions = function _ControllerYouTube2_getConfigI18nOptions() {
    const defer = kew_1.default.defer();
    const model = model_1.default.getInstance(model_1.ModelType.Config);
    model.getI18nOptions().then((options) => {
        const selectedValues = {
            region: YouTube2Context_1.default.getConfigValue('region'),
            language: YouTube2Context_1.default.getConfigValue('language')
        };
        const selected = {
            region: { label: '', value: '' },
            language: { label: '', value: '' }
        };
        Object.keys(selected).forEach((key) => {
            selected[key] = options[key]?.optionValues.find((ov) => ov.value === selectedValues[key]) || { label: '', value: selectedValues[key] };
        });
        defer.resolve({
            options,
            selected
        });
    });
    return defer.promise;
}, _ControllerYouTube2_getConfigAccountInfo = function _ControllerYouTube2_getConfigAccountInfo() {
    const defer = kew_1.default.defer();
    const model = model_1.default.getInstance(model_1.ModelType.Account);
    model.getInfo().then((account) => {
        defer.resolve(account);
    })
        .catch((error) => {
        YouTube2Context_1.default.getLogger().warn(`[youtube2] Failed to get account config: ${error}`);
        defer.resolve(null);
    });
    return defer.promise;
}, _ControllerYouTube2_getAuthStatus = function _ControllerYouTube2_getAuthStatus() {
    const defer = kew_1.default.defer();
    InnertubeLoader_1.default.getInstance().then(({ auth }) => {
        defer.resolve(auth.getStatus());
    })
        .catch((error) => {
        YouTube2Context_1.default.getLogger().warn(`[youtube2] Failed to get auth status: ${error}`);
        defer.resolve(null);
    });
    return defer.promise;
}, _ControllerYouTube2_configCheckAutoplay = function _ControllerYouTube2_configCheckAutoplay() {
    const addToHistory = YouTube2Context_1.default.getConfigValue('addToHistory');
    const autoplay = YouTube2Context_1.default.getConfigValue('autoplay');
    if (autoplay && !addToHistory) {
        const modalData = {
            title: YouTube2Context_1.default.getI18n('YOUTUBE2_AUTOPLAY'),
            message: YouTube2Context_1.default.getI18n('YOUTUBE2_MSG_AUTOPLAY_ADD_TO_HISTORY'),
            size: 'lg',
            buttons: [
                {
                    name: YouTube2Context_1.default.getI18n('YOUTUBE2_CONFIRM_ADD_TO_HISTORY'),
                    class: 'btn btn-info',
                    emit: 'callMethod',
                    payload: {
                        endpoint: 'music_service/youtube2',
                        method: 'configEnableAddToHistory'
                    }
                },
                {
                    name: YouTube2Context_1.default.getI18n('YOUTUBE2_NO'),
                    class: 'btn'
                }
            ]
        };
        __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").broadcastMessage('openModal', modalData);
    }
}, _ControllerYouTube2_addToBrowseSources = function _ControllerYouTube2_addToBrowseSources() {
    const source = {
        name: 'YouTube2',
        uri: 'youtube2',
        plugin_type: 'music_service',
        plugin_name: 'youtube2',
        albumart: '/albumart?sourceicon=music_service/youtube2/dist/assets/images/youtube.svg'
    };
    __classPrivateFieldGet(this, _ControllerYouTube2_commandRouter, "f").volumioAddToBrowseSources(source);
};
module.exports = ControllerYouTube2;
//# sourceMappingURL=index.js.map