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
var _JellyfinNowPlayingMetadataProvider_connectionManager;
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importStar(require("../model"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
const ServerHelper_1 = __importDefault(require("./ServerHelper"));
const JellyfinContext_1 = __importDefault(require("../JellyfinContext"));
class JellyfinNowPlayingMetadataProvider {
    constructor(connectionManager) {
        _JellyfinNowPlayingMetadataProvider_connectionManager.set(this, void 0);
        this.version = '1.0.0';
        __classPrivateFieldSet(this, _JellyfinNowPlayingMetadataProvider_connectionManager, connectionManager, "f");
    }
    async getSongInfo(songTitle, _albumTitle, _artistName, uri) {
        JellyfinContext_1.default.getLogger().info(`[jellyfin] Fetch song info for Now Playing plugin. URI: ${uri}`);
        if (!uri) {
            JellyfinContext_1.default.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: no URI');
            return null;
        }
        const views = ViewHelper_1.default.getViewsFromUri(uri);
        const currentView = views.pop();
        if (!currentView || currentView.name !== 'song' || !currentView.songId) {
            JellyfinContext_1.default.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: URI does not point to a song');
            return null;
        }
        const connection = await ServerHelper_1.default.getConnectionByView(currentView, __classPrivateFieldGet(this, _JellyfinNowPlayingMetadataProvider_connectionManager, "f"));
        if (!connection) {
            JellyfinContext_1.default.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: no connection to server');
            return null;
        }
        const model = model_1.default.getInstance(model_1.ModelType.Song, connection);
        let lyrics = null;
        try {
            lyrics = await model.getLyrics(currentView.songId);
        }
        catch (error) {
            JellyfinContext_1.default.getLogger().error(`[jellyfin] Error fetching lyrics: ${error instanceof Error ? error.message : error}`);
        }
        if (lyrics) {
            JellyfinContext_1.default.getLogger().info(`[jellyfin] Fetched lyrics for Now Playing plugin (type ${lyrics.type})`);
        }
        else {
            JellyfinContext_1.default.getLogger().info('[jellyfin] Lyrics unavailable for Now Playing plugin');
        }
        return {
            title: songTitle,
            lyrics
        };
    }
    async getAlbumInfo() {
        return null;
    }
    async getArtistInfo() {
        return null;
    }
}
exports.default = JellyfinNowPlayingMetadataProvider;
_JellyfinNowPlayingMetadataProvider_connectionManager = new WeakMap();
//# sourceMappingURL=JellyfinNowPlayingMetadataProvider.js.map