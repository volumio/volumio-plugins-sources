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
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const PlayController_1 = __importDefault(require("../controller/play/PlayController"));
const Endpoint_1 = require("../types/Endpoint");
class YouTube2NowPlayingMetadataProvider {
    constructor() {
        this.version = '1.0.0';
    }
    async getSongInfo(songTitle, _albumTitle, artistName, uri) {
        YouTube2Context_1.default.getLogger().info(`[youtube2] Fetch song info for Now Playing plugin. URI: ${uri}`);
        // URI: youtube2/[song/video]@explodeTrackData={...}
        const { info: playbackInfo } = (uri ? await PlayController_1.default.getPlaybackInfoFromUri(uri) : null) || { videoId: null, info: null };
        if (!playbackInfo) {
            YouTube2Context_1.default.getLogger().error('[youtube2] Error fetching song info for Now Playing plugin: no playback info from URI');
            return null;
        }
        const song = {
            title: playbackInfo.title || songTitle,
            image: playbackInfo.thumbnail,
            description: playbackInfo.description,
            artist: null,
            album: null
        };
        if (playbackInfo.author.channelId) {
            song.artist = await this.getArtistInfo(playbackInfo.author.name || artistName, { channelId: playbackInfo.author.channelId });
        }
        return song;
    }
    async getAlbumInfo() {
        return null;
    }
    async getArtistInfo(artistName, payload) {
        let channelId = null;
        if (typeof payload === 'string') {
            // URI: generic@endpoint={...}
            YouTube2Context_1.default.getLogger().info(`[youtube2] Fetch artist info for Now Playing plugin. URI: ${payload}`);
            const view = ViewHelper_1.default.getViewsFromUri(payload).pop();
            if (view?.name !== 'generic' || !view.endpoint || typeof view.endpoint !== 'object' || view.type !== Endpoint_1.EndpointType.Browse) {
                YouTube2Context_1.default.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: invalid URI');
                return null;
            }
            channelId = view.endpoint.payload.browseId;
        }
        else {
            channelId = payload?.channelId || null;
        }
        if (!channelId) {
            YouTube2Context_1.default.getLogger().error('[youtube2] Not fetching artist info for Now Playing plugin: no channel ID available');
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
            YouTube2Context_1.default.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: no data');
            return null;
        }
        if (!artistName && !channelData.title) {
            YouTube2Context_1.default.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: data is missing name');
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
exports.default = YouTube2NowPlayingMetadataProvider;
//# sourceMappingURL=YouTube2NowPlayingMetadataProvider.js.map