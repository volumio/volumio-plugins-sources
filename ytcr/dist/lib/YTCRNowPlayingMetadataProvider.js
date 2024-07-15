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
var _YTCRNowPlayingMetadataProvider_instances, _YTCRNowPlayingMetadataProvider_player, _YTCRNowPlayingMetadataProvider_logger, _YTCRNowPlayingMetadataProvider_getMusicServicePlugin, _YTCRNowPlayingMetadataProvider_getSongInfoWithYTMusicPlugin, _YTCRNowPlayingMetadataProvider_getYTMusicTrackURI, _YTCRNowPlayingMetadataProvider_getSongInfoWithYouTube2Plugin, _YTCRNowPlayingMetadataProvider_getYouTube2TrackURI, _YTCRNowPlayingMetadataProvider_hasNowPlayingMetadataProvider;
Object.defineProperty(exports, "__esModule", { value: true });
const YTCRContext_1 = __importDefault(require("./YTCRContext"));
const semver_1 = __importDefault(require("semver"));
const REQUIRED_YTMUSIC_PLUGIN_VERSION = '>=1.1.0';
const REQUIRED_YOUTUBE2_PLUGIN_VERSION = '>=1.2.0';
class YTCRNowPlayingMetadataProvider {
    constructor(player, logger) {
        _YTCRNowPlayingMetadataProvider_instances.add(this);
        _YTCRNowPlayingMetadataProvider_player.set(this, void 0);
        _YTCRNowPlayingMetadataProvider_logger.set(this, void 0);
        this.version = '1.0.0';
        __classPrivateFieldSet(this, _YTCRNowPlayingMetadataProvider_player, player, "f");
        __classPrivateFieldSet(this, _YTCRNowPlayingMetadataProvider_logger, logger, "f");
    }
    async getSongInfo(songTitle, albumTitle, artistName) {
        const current = __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_player, "f").currentVideo;
        switch (current?.src) {
            case 'yt':
                return __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getSongInfoWithYouTube2Plugin).call(this, current, songTitle, albumTitle, artistName);
            case 'ytmusic':
                return __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getSongInfoWithYTMusicPlugin).call(this, current, songTitle, albumTitle, artistName);
            default:
                return null;
        }
    }
    async getAlbumInfo() {
        return null;
    }
    async getArtistInfo() {
        return null;
    }
}
exports.default = YTCRNowPlayingMetadataProvider;
_YTCRNowPlayingMetadataProvider_player = new WeakMap(), _YTCRNowPlayingMetadataProvider_logger = new WeakMap(), _YTCRNowPlayingMetadataProvider_instances = new WeakSet(), _YTCRNowPlayingMetadataProvider_getMusicServicePlugin = async function _YTCRNowPlayingMetadataProvider_getMusicServicePlugin(pluginName, pluginPrettyName, requiredVersion) {
    __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").debug(`[ytcr] Obtaining ${pluginPrettyName} plugin instance`);
    const plugin = YTCRContext_1.default.getMusicServicePlugin(pluginName);
    if (!__classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_hasNowPlayingMetadataProvider).call(this, plugin)) {
        return null;
    }
    let pluginInfo = null;
    try {
        pluginInfo = await YTCRContext_1.default.getPluginInfo(pluginName, 'music_service');
    }
    catch (error) {
        __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").warn(`[ytcr] Error getting ${pluginPrettyName} plugin info`, error);
    }
    if (pluginInfo?.version) {
        if (!semver_1.default.satisfies(pluginInfo.version, requiredVersion)) {
            __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").warn(`[ytcr] ${pluginPrettyName} plugin version '${pluginInfo.version}' does not satisfy '${requiredVersion}'`);
        }
        else {
            __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").debug(`[ytcr] ${pluginPrettyName} plugin version is ${pluginInfo.version}`);
        }
    }
    else {
        __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").warn(`[ytcr] ${pluginPrettyName} plugin version unavailable`);
    }
    return plugin;
}, _YTCRNowPlayingMetadataProvider_getSongInfoWithYTMusicPlugin = async function _YTCRNowPlayingMetadataProvider_getSongInfoWithYTMusicPlugin(target, songTitle, albumTitle, artistName) {
    const plugin = await __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getMusicServicePlugin).call(this, 'ytmusic', 'YouTube Music', REQUIRED_YTMUSIC_PLUGIN_VERSION);
    if (!plugin) {
        return null;
    }
    __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").info('[ytcr] Delegating getSongInfo() to YouTube Music plugin');
    const uri = __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getYTMusicTrackURI).call(this, target, { songTitle, albumTitle, artistName });
    const provider = plugin.getNowPlayingMetadataProvider();
    if (provider) {
        return provider.getSongInfo(songTitle, albumTitle, artistName, uri);
    }
    return null;
}, _YTCRNowPlayingMetadataProvider_getYTMusicTrackURI = function _YTCRNowPlayingMetadataProvider_getYTMusicTrackURI(info, params) {
    // Ytmusic URI: ytmusic/[song/video]@explodeTrackData={...}
    const { songTitle, artistName, albumTitle } = params;
    const explodedTrackInfo = {
        type: 'song',
        title: info.title || songTitle || '',
        artist: info.artist || artistName || '',
        album: info.album || albumTitle || '',
        albumart: info.thumbnail || '',
        endpoint: {
            type: 'watch',
            payload: {
                videoId: info.id
            }
        }
    };
    return `ytmusic/song@explodeTrackData:o=${encodeURIComponent(JSON.stringify(explodedTrackInfo))}`;
}, _YTCRNowPlayingMetadataProvider_getSongInfoWithYouTube2Plugin = async function _YTCRNowPlayingMetadataProvider_getSongInfoWithYouTube2Plugin(target, songTitle, albumTitle, artistName) {
    const plugin = await __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getMusicServicePlugin).call(this, 'youtube2', 'YouTube2', REQUIRED_YOUTUBE2_PLUGIN_VERSION);
    if (!plugin) {
        return null;
    }
    __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_logger, "f").info('[ytcr] Delegating getSongInfo() to YouTube2 plugin');
    const uri = __classPrivateFieldGet(this, _YTCRNowPlayingMetadataProvider_instances, "m", _YTCRNowPlayingMetadataProvider_getYouTube2TrackURI).call(this, target, { songTitle, albumTitle, artistName });
    const provider = plugin.getNowPlayingMetadataProvider();
    if (provider) {
        return provider.getSongInfo(songTitle, albumTitle, artistName, uri);
    }
    return null;
}, _YTCRNowPlayingMetadataProvider_getYouTube2TrackURI = function _YTCRNowPlayingMetadataProvider_getYouTube2TrackURI(info, params) {
    // YouTube2 URI: youtube2/video@endpoint={...}@explodeTrackData={...}
    const { songTitle, artistName } = params;
    const endpoint = {
        type: 'watch',
        payload: {
            videoId: info.id
        }
    };
    const explodedTrackInfo = {
        title: info.title || songTitle || '',
        artist: info.artist || artistName || '',
        albumart: info.thumbnail || '',
        endpoint
    };
    return `youtube2/video@endpoint:o=${encodeURIComponent(JSON.stringify(endpoint))}@explodeTrackData:o=${encodeURIComponent(JSON.stringify(explodedTrackInfo))}`;
}, _YTCRNowPlayingMetadataProvider_hasNowPlayingMetadataProvider = function _YTCRNowPlayingMetadataProvider_hasNowPlayingMetadataProvider(plugin) {
    return plugin && typeof plugin['getNowPlayingMetadataProvider'] === 'function';
};
//# sourceMappingURL=YTCRNowPlayingMetadataProvider.js.map