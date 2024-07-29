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
var _DefaultMetadataProvider_instances, _DefaultMetadataProvider_genius, _DefaultMetadataProvider_accessToken, _DefaultMetadataProvider_getSongSnippet, _DefaultMetadataProvider_getAlbumSnippet, _DefaultMetadataProvider_getArtistSnippet, _DefaultMetadataProvider_getSongByNameOrBestMatch, _DefaultMetadataProvider_getAlbumByNameOrBestMatch;
Object.defineProperty(exports, "__esModule", { value: true });
const genius_fetch_1 = __importStar(require("genius-fetch"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const lrclib_1 = __importDefault(require("./lrclib"));
class DefaultMetadataProvider {
    constructor() {
        _DefaultMetadataProvider_instances.add(this);
        _DefaultMetadataProvider_genius.set(this, void 0);
        _DefaultMetadataProvider_accessToken.set(this, void 0);
        __classPrivateFieldSet(this, _DefaultMetadataProvider_genius, new genius_fetch_1.default(), "f");
    }
    config(params) {
        this.version = '1.1.0';
        __classPrivateFieldSet(this, _DefaultMetadataProvider_accessToken, params.accessToken, "f");
        __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").config(params);
    }
    async getSongInfo(songTitle, albumTitle, artistName, duration, _uri, fillTarget) {
        const needGetLyrics = !fillTarget ||
            !fillTarget.lyrics ||
            (fillTarget.lyrics?.type !== 'synced' && NowPlayingContext_1.default.getConfigValue('metadataService').enableSyncedLyrics);
        const result = {
            title: songTitle,
            lyrics: needGetLyrics ? await lrclib_1.default.getLyrics(songTitle, albumTitle, artistName, duration) : null
        };
        if (!__classPrivateFieldGet(this, _DefaultMetadataProvider_accessToken, "f")) {
            if (result.lyrics) {
                return result;
            }
            throw Error(NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
        }
        // Fetch from Genius
        try {
            // Do not include album, as compilation albums tend to result in false hits
            const matchParams = {
                name: songTitle,
                artist: artistName
            };
            const song = await __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getSongByNameOrBestMatch).call(this, matchParams);
            const songSnippet = __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getSongSnippet).call(this, song);
            if (song && songSnippet) {
                const { title, description, image, embed } = songSnippet;
                result.title = title;
                result.description = description;
                result.image = image;
                if (song.artists && song.artists.primary) {
                    const artist = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getArtistById(song.artists.primary.id, { textFormat: genius_fetch_1.TextFormat.Plain });
                    result.artist = __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getArtistSnippet).call(this, artist);
                }
                if (embed && !result.lyrics) {
                    const embedContents = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").parseSongEmbed(embed);
                    if (embedContents) {
                        result.lyrics = {
                            type: 'html',
                            lines: embedContents.contentParts.join()
                        };
                    }
                }
            }
            // No song found, but still attempt to fetch artist info
            else if (artistName) {
                result.artist = await this.getArtistInfo(artistName);
            }
            // Finally, fetch album info
            if (albumTitle) {
                result.album = await this.getAlbumInfo(albumTitle, artistName);
            }
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] Error fetching from Genius:', error));
            if (!result.lyrics) {
                throw error;
            }
        }
        return result;
    }
    async getAlbumInfo(albumTitle, artistName) {
        if (!__classPrivateFieldGet(this, _DefaultMetadataProvider_accessToken, "f")) {
            throw Error(NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
        }
        const album = await __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getAlbumByNameOrBestMatch).call(this, {
            name: albumTitle,
            artist: artistName
        });
        const result = __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getAlbumSnippet).call(this, album) || { title: albumTitle };
        if (album && album.artist) {
            const artist = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getArtistById(album.artist.id, { textFormat: genius_fetch_1.TextFormat.Plain });
            result.artist = __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getArtistSnippet).call(this, artist);
        }
        return result;
    }
    async getArtistInfo(artistName) {
        if (!__classPrivateFieldGet(this, _DefaultMetadataProvider_accessToken, "f")) {
            throw Error(NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
        }
        const artist = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getArtistsByName(artistName, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
        return __classPrivateFieldGet(this, _DefaultMetadataProvider_instances, "m", _DefaultMetadataProvider_getArtistSnippet).call(this, artist.items[0]) || { name: artistName };
    }
    clearCache() {
        __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").clearCache();
    }
}
exports.default = DefaultMetadataProvider;
_DefaultMetadataProvider_genius = new WeakMap(), _DefaultMetadataProvider_accessToken = new WeakMap(), _DefaultMetadataProvider_instances = new WeakSet(), _DefaultMetadataProvider_getSongSnippet = function _DefaultMetadataProvider_getSongSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description,
        image: info.image,
        embed: info.embed
    };
}, _DefaultMetadataProvider_getAlbumSnippet = function _DefaultMetadataProvider_getAlbumSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        title: info.title.regular,
        description: info.description,
        releaseDate: info.releaseDate?.text,
        image: info.image
    };
}, _DefaultMetadataProvider_getArtistSnippet = function _DefaultMetadataProvider_getArtistSnippet(info) {
    if (!info) {
        return null;
    }
    return {
        name: info.name,
        description: info.description,
        image: info.image
    };
}, _DefaultMetadataProvider_getSongByNameOrBestMatch = async function _DefaultMetadataProvider_getSongByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }
    if (params.artist) {
        return __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getSongByBestMatch({ ...params, artist: params.artist }, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true });
    }
    const song = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getSongsByName(params.name, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
    return song.items[0] || null;
}, _DefaultMetadataProvider_getAlbumByNameOrBestMatch = async function _DefaultMetadataProvider_getAlbumByNameOrBestMatch(params) {
    if (!params.name) {
        return null;
    }
    if (params.artist) {
        return __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getAlbumByBestMatch({ ...params, artist: params.artist }, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true });
    }
    const album = await __classPrivateFieldGet(this, _DefaultMetadataProvider_genius, "f").getAlbumsByName(params.name, { textFormat: genius_fetch_1.TextFormat.Plain, obtainFullInfo: true, limit: 1 });
    return album.items[0] || null;
};
//# sourceMappingURL=DefaultMetadataProvider.js.map