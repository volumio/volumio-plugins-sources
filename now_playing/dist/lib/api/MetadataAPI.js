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
var _MetadataAPI_instances, _MetadataAPI_fetchPromises, _MetadataAPI_genius, _MetadataAPI_settings, _MetadataAPI_cache, _MetadataAPI_getFetchPromise, _MetadataAPI_getSongSnippet, _MetadataAPI_getAlbumSnippet, _MetadataAPI_getArtistSnippet, _MetadataAPI_getSongByNameOrBestMatch, _MetadataAPI_getSongInfo, _MetadataAPI_getAlbumByNameOrBestMatch, _MetadataAPI_getAlbumInfo, _MetadataAPI_getArtistInfo, _MetadataAPI_excludeParenthesis;
Object.defineProperty(exports, "__esModule", { value: true });
const genius_fetch_1 = __importStar(require("genius-fetch"));
const md5_1 = __importDefault(require("md5"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const Cache_1 = __importDefault(require("../utils/Cache"));
const Misc_1 = require("../utils/Misc");
const lodash_1 = require("lodash");
class MetadataAPI {
    constructor() {
        _MetadataAPI_instances.add(this);
        _MetadataAPI_fetchPromises.set(this, void 0);
        _MetadataAPI_genius.set(this, void 0);
        _MetadataAPI_settings.set(this, void 0);
        _MetadataAPI_cache.set(this, void 0);
        __classPrivateFieldSet(this, _MetadataAPI_fetchPromises, {
            'song': {},
            'album': {},
            'artist': {}
        }, "f");
        __classPrivateFieldSet(this, _MetadataAPI_genius, new genius_fetch_1.default(), "f");
        __classPrivateFieldSet(this, _MetadataAPI_settings, null, "f");
        __classPrivateFieldSet(this, _MetadataAPI_cache, new Cache_1.default({ song: 3600, album: 3600, artist: 3600 }, { song: 200, album: 200, artist: 200 }), "f");
    }
    clearCache() {
        __classPrivateFieldGet(this, _MetadataAPI_genius, "f").clearCache();
        __classPrivateFieldGet(this, _MetadataAPI_cache, "f").clear();
    }
    updateSettings(settings) {
        const tokenChanged = !__classPrivateFieldGet(this, _MetadataAPI_settings, "f") || settings.geniusAccessToken !== __classPrivateFieldGet(this, _MetadataAPI_settings, "f").geniusAccessToken;
        __classPrivateFieldSet(this, _MetadataAPI_settings, settings, "f");
        if (tokenChanged) {
            __classPrivateFieldGet(this, _MetadataAPI_genius, "f").config({ accessToken: settings.geniusAccessToken });
            this.clearCache();
        }
    }
    async fetchInfo(params) {
        const isTrackNumberEnabled = NowPlayingContext_1.default.getPluginSetting('music_service', 'mpd', 'tracknumbers');
        if (!NowPlayingContext_1.default.getConfigValue('metadataService').geniusAccessToken) {
            throw Error(NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
        }
        try {
            let info;
            params = {
                type: params.type,
                ...__classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_excludeParenthesis).call(this, params)
            };
            NowPlayingContext_1.default.getLogger().info(`[now-playing] Fetch metadata: ${JSON.stringify(params)}`);
            const cacheKey = (0, md5_1.default)(JSON.stringify(params));
            if (params.type === 'song' && params.album) {
                const album = params.album;
                const name = isTrackNumberEnabled ? (0, Misc_1.removeSongNumber)(params.name) : params.name;
                info = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('song', cacheKey, () => __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getSongInfo).call(this, { ...params, album, name }));
            }
            else if (params.type === 'album') {
                info = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('album', cacheKey, () => __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getAlbumInfo).call(this, params));
            }
            else if (params.type === 'artist') {
                info = await __classPrivateFieldGet(this, _MetadataAPI_cache, "f").getOrSet('artist', cacheKey, () => __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getArtistInfo).call(this, params));
            }
            else {
                throw Error(`Unknown metadata type ${params.type}`);
            }
            return info;
        }
        catch (e) {
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
    }
}
_MetadataAPI_fetchPromises = new WeakMap(), _MetadataAPI_genius = new WeakMap(), _MetadataAPI_settings = new WeakMap(), _MetadataAPI_cache = new WeakMap(), _MetadataAPI_instances = new WeakSet(), _MetadataAPI_getFetchPromise = function _MetadataAPI_getFetchPromise(type, params, callback) {
    const key = (0, md5_1.default)(JSON.stringify(params));
    if (Object.keys(__classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[type]).includes(key)) {
        return __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[type][key];
    }
    const promise = callback();
    __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[type][key] = promise;
    promise.finally(() => {
        delete __classPrivateFieldGet(this, _MetadataAPI_fetchPromises, "f")[type][key];
    });
    return promise;
}, _MetadataAPI_getSongSnippet = function _MetadataAPI_getSongSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description,
        image: info.image,
        embed: info.embed
    };
}, _MetadataAPI_getAlbumSnippet = function _MetadataAPI_getAlbumSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description,
        releaseDate: info.releaseDate?.text,
        image: info.image
    };
}, _MetadataAPI_getArtistSnippet = function _MetadataAPI_getArtistSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        name: info.name,
        description: info.description,
        image: info.image
    };
}, _MetadataAPI_getSongByNameOrBestMatch = async function _MetadataAPI_getSongByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }
    if (params.artist) {
        return __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getSongByBestMatch({ ...params, artist: params.artist }, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true });
    }
    const song = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getSongsByName(params.name, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
    return song.items[0] || null;
}, _MetadataAPI_getSongInfo = function _MetadataAPI_getSongInfo(params) {
    return __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getFetchPromise).call(this, 'song', params, async () => {
        const result = {
            song: null,
            artist: null,
            album: null
        };
        // Do not include album, as compilation albums tend to result in false hits
        const matchParams = {
            name: params.name,
            artist: params.artist
        };
        const song = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getSongByNameOrBestMatch).call(this, matchParams);
        if (song) {
            result.song = __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getSongSnippet).call(this, song);
            if (song.artists && song.artists.primary) {
                const artist = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getArtistById(song.artists.primary.id, { textFormat: genius_fetch_1.TextFormat.Plain });
                result.artist = __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getArtistSnippet).call(this, artist);
            }
            if (result.song?.embed) {
                const embedContents = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").parseSongEmbed(result.song.embed);
                if (embedContents) {
                    result.song.embedContents = embedContents;
                }
            }
        }
        // No song found, but still attempt to fetch artist info
        else if (params.artist) {
            const artistInfo = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getArtistInfo).call(this, { name: params.artist });
            if (artistInfo.artist) {
                result.artist = artistInfo.artist;
            }
        }
        // Finally, fetch album info
        const albumInfo = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getAlbumInfo).call(this, {
            name: params.album,
            artist: params.artist
        });
        if (albumInfo) {
            result.album = albumInfo.album;
        }
        return result;
    });
}, _MetadataAPI_getAlbumByNameOrBestMatch = async function _MetadataAPI_getAlbumByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }
    if (params.artist) {
        return __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getAlbumByBestMatch({ ...params, artist: params.artist }, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true });
    }
    const album = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getAlbumsByName(params.name, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
    return album.items[0] || null;
}, _MetadataAPI_getAlbumInfo = function _MetadataAPI_getAlbumInfo(params) {
    return __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getFetchPromise).call(this, 'album', params, async () => {
        const result = {
            album: null,
            artist: null
        };
        const album = await __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getAlbumByNameOrBestMatch).call(this, params);
        result.album = __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getAlbumSnippet).call(this, album);
        if (album && album.artist) {
            const artist = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getArtistById(album.artist.id, { textFormat: genius_fetch_1.TextFormat.Plain });
            result.artist = __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getArtistSnippet).call(this, artist);
        }
        return result;
    });
}, _MetadataAPI_getArtistInfo = function _MetadataAPI_getArtistInfo(params) {
    return __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getFetchPromise).call(this, 'artist', params, async () => {
        const result = {
            artist: null
        };
        if (!params.name) {
            return result;
        }
        const artist = await __classPrivateFieldGet(this, _MetadataAPI_genius, "f").getArtistsByName(params.name, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
        result.artist = __classPrivateFieldGet(this, _MetadataAPI_instances, "m", _MetadataAPI_getArtistSnippet).call(this, artist.items[0]);
        return result;
    });
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
};
const metadataAPI = new MetadataAPI();
exports.default = metadataAPI;
//# sourceMappingURL=MetadataAPI.js.map