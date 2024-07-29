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
var _MetadataAPI_instances, _MetadataAPI_fetchPromises, _MetadataAPI_defaultMetadataProvider, _MetadataAPI_settings, _MetadataAPI_cache, _MetadataAPI_getFetchPromise, _MetadataAPI_isSongInfoComplete, _MetadataAPI_isBasicAlbumInfoComplete, _MetadataAPI_isBasicArtistInfoComplete, _MetadataAPI_doFetchInfo, _MetadataAPI_excludeParenthesis, _MetadataAPI_getProvider, _MetadataAPI_hasNowPlayingMetadataProvider, _MetadataAPI_validateNowPlayingMetadataProvider;
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const Cache_1 = __importDefault(require("../utils/Cache"));
const Misc_1 = require("../utils/Misc");
const lodash_1 = require("lodash");
const DefaultMetadataProvider_1 = __importDefault(require("./DefaultMetadataProvider"));
const escape_html_1 = __importDefault(require("escape-html"));
const semver_1 = __importDefault(require("semver"));
const REQUIRED_PROVIDER_VERSION = '1.x';
class MetadataAPI {
    constructor() {
        _MetadataAPI_instances.add(this);
        _MetadataAPI_fetchPromises.set(this, void 0);
        _MetadataAPI_defaultMetadataProvider.set(this, void 0);
        _MetadataAPI_settings.set(this, void 0);
        _MetadataAPI_cache.set(this, void 0);
        __classPrivateFieldSet(this, _MetadataAPI_fetchPromises, {}, "f");
        __classPrivateFieldSet(this, _MetadataAPI_defaultMetadataProvider, new DefaultMetadataProvider_1.default(), "f");
        __classPrivateFieldSet(this, _MetadataAPI_settings, null, "f");
        __classPrivateFieldSet(this, _MetadataAPI_cache, new Cache_1.default({ song: 3600, album: 3600, artist: 3600 }, { song: 200, album: 200, artist: 200 }), "f");
    }
    clearCache() {
        __classPrivateFieldGet(this, _MetadataAPI_defaultMetadataProvider, "f").clearCache();
        __classPrivateFieldGet(this, _MetadataAPI_cache, "f").clear();
    }
    updateSettings(settings) {
        const tokenChanged = !__classPrivateFieldGet(this, _MetadataAPI_settings, "f") || settings.geniusAccessToken !== __classPrivateFieldGet(this, _MetadataAPI_settings, "f").geniusAccessToken;
        __classPrivateFieldSet(this, _MetadataAPI_settings, settings, "f");
        if (tokenChanged) {
            __classPrivateFieldGet(this, _MetadataAPI_defaultMetadataProvider, "f").config({ accessToken: settings.geniusAccessToken });
            this.clearCache();
        }
    }
    async fetchInfo(params) {
        const { info, provider } = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_doFetchInfo).call(this, params);
        if (!(provider instanceof DefaultMetadataProvider_1.default)) {
            let needFillInfo = false;
            switch (params.type) {
                case 'song':
                    needFillInfo = !__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_isSongInfoComplete).call(this, info);
                    break;
                case 'album':
                    needFillInfo = !__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_isBasicAlbumInfoComplete).call(this, info);
                    break;
                case 'artist':
                    needFillInfo = !__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_isBasicArtistInfoComplete).call(this, info);
                    break;
            }
            if (needFillInfo) {
                try {
                    const { info: fillInfo } = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_doFetchInfo).call(this, params, true, info);
                    return (0, Misc_1.assignObjectEmptyProps)({}, info, fillInfo);
                }
                catch (error) {
                    // Do nothing
                }
            }
        }
        if (info.song?.lyrics?.type === 'synced' && !NowPlayingContext_1.default.getConfigValue('metadataService').enableSyncedLyrics) {
            info.song.lyrics = {
                type: 'plain',
                lines: info.song.lyrics.lines.map((line) => (0, escape_html_1.default)(line.text))
            };
        }
        return info;
    }
}
_MetadataAPI_fetchPromises = new WeakMap(), _MetadataAPI_defaultMetadataProvider = new WeakMap(), _MetadataAPI_settings = new WeakMap(), _MetadataAPI_cache = new WeakMap(), _MetadataAPI_instances = new WeakSet(), _MetadataAPI_getFetchPromise = function _MetadataAPI_getFetchPromise(key, callback) {
    if (Object.keys(__classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")).includes(key)) {
        return __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[key];
    }
    const promise = callback();
    __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[key] = promise;
    promise.finally(() => {
        delete __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[key];
    });
    return promise;
}, _MetadataAPI_isSongInfoComplete = function _MetadataAPI_isSongInfoComplete(info) {
    return !!(info?.song && info.song.description && info.song.lyrics && __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_isBasicAlbumInfoComplete).call(this, info));
}, _MetadataAPI_isBasicAlbumInfoComplete = function _MetadataAPI_isBasicAlbumInfoComplete(info) {
    return !!(info?.album && info.album.description && __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_isBasicArtistInfoComplete).call(this, info));
}, _MetadataAPI_isBasicArtistInfoComplete = function _MetadataAPI_isBasicArtistInfoComplete(info) {
    return !!(info?.artist && info.artist.description && info.artist.image);
}, _MetadataAPI_doFetchInfo = async function _MetadataAPI_doFetchInfo(params, useDefaultProvider = false, fillTarget) {
    const isTrackNumberEnabled = NowPlayingContext_1.default.getPluginSetting('music_service', 'mpd', 'tracknumbers');
    const { provider, service: providerSource } = useDefaultProvider ? {
        provider: __classPrivateFieldGet(this, _MetadataAPI_defaultMetadataProvider, "f"),
        service: ''
    } : __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getProvider).call(this, params.uri, params.service);
    try {
        params = {
            type: params.type,
            ...__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_excludeParenthesis).call(this, params),
            duration: params.duration,
            uri: params.uri,
            service: providerSource
        };
        const providerStr = providerSource ? `(${providerSource} plugin)` : '(DefaultMetadataProvider)';
        NowPlayingContext_1.default.getLogger().info(`[now-playing] Fetch metadata ${providerStr}: ${JSON.stringify(params)}`);
        const cacheKey = (0, md5_1.default)(JSON.stringify({ ...params, providerSource }));
        const info = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getFetchPromise).call(this, cacheKey, async () => {
            if (params.type === 'song') {
                const name = isTrackNumberEnabled ? (0, Misc_1.removeSongNumber)(params.name) : params.name;
                let songInfo;
                switch (provider.version) {
                    case '1.0.0':
                        songInfo = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, params.uri));
                        break;
                    case '1.1.0':
                        if (provider instanceof DefaultMetadataProvider_1.default && fillTarget) {
                            songInfo = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, Number(params.duration), params.uri, fillTarget['song']));
                        }
                        else {
                            songInfo = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, Number(params.duration), params.uri));
                        }
                        break;
                }
                return {
                    song: songInfo || null,
                    album: songInfo?.album || null,
                    artist: songInfo?.artist || null
                };
            }
            else if (params.type === 'album') {
                const albumInfo = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('album', cacheKey, () => provider.getAlbumInfo(params.name, params.artist, params.uri));
                return {
                    album: albumInfo || null,
                    artist: albumInfo?.artist || null
                };
            }
            else if (params.type === 'artist') {
                const artistInfo = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('artist', cacheKey, () => provider.getArtistInfo(params.name, params.uri));
                return {
                    artist: artistInfo || null
                };
            }
            throw Error(`Unknown metadata type ${params.type}`);
        });
        return {
            info,
            provider
        };
    }
    catch (e) {
        if (!(provider instanceof DefaultMetadataProvider_1.default)) {
            NowPlayingContext_1.default.getLogger().error(`[now_playing] Error fetching metdata using ${providerSource} plugin: ${e instanceof Error ? e.message : e}`);
            NowPlayingContext_1.default.getLogger().error('[now_playing] Falling back to DefaultMetadataProvider');
            return __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_doFetchInfo).call(this, params, true);
        }
        const { message, statusCode, statusMessage } = e;
        const status = (statusCode && statusMessage) ? `${statusCode} - ${statusMessage}` : (statusCode || statusMessage);
        let msg;
        if (status) {
            msg = `${NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_FETCH')}: ${status}`;
        }
        else {
            msg = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_FETCH') + (message ? `: ${message}` : '');
        }
        throw Error(msg);
    }
}, _MetadataAPI_excludeParenthesis = function _MetadataAPI_excludeParenthesis(params) {
    if (!__classPrivateFieldGet(this, _MetadataAPI_settings, "f") || !__classPrivateFieldGet(this, _MetadataAPI_settings, "f").excludeParenthesized) {
        return params;
    }
    const __strip = (s, parentheses) => {
        if (!s) {
            return s;
        }
        let result = s;
        for (const p of parentheses) {
            const [opening, closing] = p;
            const regexStr = `(${(0, lodash_1.escapeRegExp)(opening)}.*?${(0, lodash_1.escapeRegExp)(closing)})`;
            result = result.replace(new RegExp(regexStr, 'gm'), '');
        }
        return result;
    };
    let parentheses;
    switch (__classPrivateFieldGet(this, _MetadataAPI_settings, "f").parenthesisType) {
        case 'round':
            parentheses = ['()'];
            break;
        case 'square':
            parentheses = ['[]'];
            break;
        case 'round+square':
            parentheses = ['()', '[]'];
            break;
    }
    return {
        name: __strip(params.name, parentheses)?.trim() || params.name,
        album: __strip(params.album, parentheses)?.trim() || params.album,
        artist: __strip(params.artist, parentheses)?.trim() || params.artist
    };
}, _MetadataAPI_getProvider = function _MetadataAPI_getProvider(uri, service) {
    if (NowPlayingContext_1.default.getConfigValue('metadataService').queryMusicServices) {
        /**
         * Always get service by URI if possible.
         * Volumio has this long-standing bug where the MPD plugin sets service as 'mpd' even when
         * consume state is on (consuming on behalf of another service).
         */
        if (uri) {
            const _service = uri.split('/')[0];
            if (_service) {
                service = _service;
            }
        }
        if (service) {
            const plugin = NowPlayingContext_1.default.getMusicServicePlugin(service);
            if (__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_hasNowPlayingMetadataProvider).call(this, plugin)) {
                const provider = plugin.getNowPlayingMetadataProvider();
                if (provider && __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_validateNowPlayingMetadataProvider).call(this, provider, service)) {
                    return {
                        provider,
                        service
                    };
                }
            }
        }
    }
    return {
        provider: __classPrivateFieldGet(this, _MetadataAPI_defaultMetadataProvider, "f"),
        service: ''
    };
}, _MetadataAPI_hasNowPlayingMetadataProvider = function _MetadataAPI_hasNowPlayingMetadataProvider(plugin) {
    return plugin && typeof plugin['getNowPlayingMetadataProvider'] === 'function';
}, _MetadataAPI_validateNowPlayingMetadataProvider = function _MetadataAPI_validateNowPlayingMetadataProvider(provider, service) {
    const logPrefix = `[now-playing] NowPlayingPluginMetadataProvider for '${service}' plugin`;
    if (typeof provider !== 'object') {
        NowPlayingContext_1.default.getLogger().error(`${logPrefix} has wrong type`);
        return false;
    }
    if (!Reflect.has(provider, 'version')) {
        NowPlayingContext_1.default.getLogger().warn(`${logPrefix} is missing version number`);
    }
    else if (!semver_1.default.satisfies(provider.version, REQUIRED_PROVIDER_VERSION)) {
        NowPlayingContext_1.default.getLogger().warn(`${logPrefix} has version '${provider.version}' which does not satisfy '${REQUIRED_PROVIDER_VERSION}'`);
    }
    const fns = [
        'getSongInfo',
        'getAlbumInfo',
        'getArtistInfo'
    ];
    if (!fns.every((fn) => Reflect.has(provider, fn) && typeof provider[fn] === 'function')) {
        NowPlayingContext_1.default.getLogger().error(`${logPrefix} is missing one of the following functions: ${fns.map((fn) => `${fn}()`).join(', ')}`);
        return false;
    }
    return true;
};
const metadataAPI = new MetadataAPI();
exports.default = metadataAPI;
//# sourceMappingURL=MetadataAPI.js.map