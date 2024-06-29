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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importStar(require("../model"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
const PlayController_1 = __importDefault(require("../controller/play/PlayController"));
const Endpoint_1 = require("../types/Endpoint");
class YTMusicNowPlayingMetadataProvider {
    constructor() {
        this.version = '1.0.0';
    }
    async getSongInfo(songTitle, albumTitle, artistName, uri) {
        YTMusicContext_1.default.getLogger().info(`[ytmusic] Fetch song info for Now Playing plugin. URI: ${uri}`);
        // URI: ytmusic/[song/video]@explodeTrackData={...}
        const { videoId, info: playbackInfo } = (uri ? await PlayController_1.default.getPlaybackInfoFromUri(uri) : null) || { videoId: null, info: null };
        if (!playbackInfo) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching song info for Now Playing plugin: no playback info from URI');
            return null;
        }
        const song = {
            title: playbackInfo.title || songTitle,
            image: playbackInfo.thumbnail,
            artist: null,
            album: null
        };
        if (playbackInfo.album.albumId) {
            song.album = await this.getAlbumInfo(playbackInfo.album.title || albumTitle, artistName, { albumId: playbackInfo.album.albumId });
        }
        if (playbackInfo.artist.channelId) {
            song.artist = await this.getArtistInfo(playbackInfo.artist.name || artistName, { channelId: playbackInfo.artist.channelId });
        }
        if (videoId) {
            try {
                song.lyrics = await model_1.default.getInstance(model_1.ModelType.MusicItem).getLyrics(videoId);
            }
            catch (error) {
                YTMusicContext_1.default.getLogger().error(YTMusicContext_1.default.getErrorMessage('[ytmusic] Error fetching lyrics:', error));
                song.lyrics = null;
            }
        }
        return song;
    }
    async getAlbumInfo(albumTitle, artistName, payload) {
        let albumId = null;
        if (typeof payload === 'string') {
            // URI: album@endpoints={ watch: ..., browse: ... }
            YTMusicContext_1.default.getLogger().info(`[ytmusic] Fetch album info for Now Playing plugin. URI: ${payload}`);
            const view = ViewHelper_1.default.getViewsFromUri(payload).pop();
            if (view?.name !== 'album' || !view.endpoints || typeof view.endpoints !== 'object' || !view.endpoints.browse) {
                YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: invalid URI');
                return null;
            }
            albumId = view.endpoints.browse.payload.browseId;
        }
        else {
            albumId = payload?.albumId || null;
        }
        if (!albumId) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Not fetching album info for Now Playing plugin: no album ID available');
            return null;
        }
        const albumEndpoint = {
            type: Endpoint_1.EndpointType.Browse,
            payload: {
                browseId: albumId
            }
        };
        const model = model_1.default.getInstance(model_1.ModelType.Endpoint);
        const albumData = (await model.getContents(albumEndpoint))?.header;
        if (!albumData) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: no data');
            return null;
        }
        if (!albumTitle && !albumData.title) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: data is missing title');
            return null;
        }
        const album = {
            title: albumData.title || albumTitle,
            description: albumData.description || null,
            image: albumData.thumbnail || null,
            artist: await this.getArtistInfo(artistName, albumData.artist?.channelId ? { channelId: albumData.artist?.channelId } : undefined)
        };
        return album;
    }
    async getArtistInfo(artistName, payload) {
        let channelId = null;
        if (typeof payload === 'string') {
            // URI: generic@endpoint={...}
            YTMusicContext_1.default.getLogger().info(`[ytmusic] Fetch artist info for Now Playing plugin. URI: ${payload}`);
            const view = ViewHelper_1.default.getViewsFromUri(payload).pop();
            if (view?.name !== 'generic' || !view.endpoint || typeof view.endpoint !== 'object' || view.type !== Endpoint_1.EndpointType.Browse) {
                YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: invalid URI');
                return null;
            }
            channelId = view.endpoint.payload.browseId;
        }
        else {
            channelId = payload?.channelId || null;
        }
        if (!channelId) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Not fetching artist info for Now Playing plugin: no channel ID available');
            return null;
        }
        const channelEndpoint = {
            type: Endpoint_1.EndpointType.Browse,
            payload: {
                browseId: channelId
            }
        };
        const model = model_1.default.getInstance(model_1.ModelType.Endpoint);
        const channelData = (await model.getContents(channelEndpoint))?.header;
        if (!channelData) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: no data');
            return null;
        }
        if (!artistName && !channelData.title) {
            YTMusicContext_1.default.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: data is missing name');
            return null;
        }
        const artist = {
            name: channelData.title || artistName,
            description: channelData.description || null,
            image: channelData.thumbnail || null
        };
        return artist;
    }
}
exports.default = YTMusicNowPlayingMetadataProvider;
//# sourceMappingURL=YTMusicNowPlayingMetadataProvider.js.map