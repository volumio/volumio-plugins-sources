"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlaylistViewHandler_instances, _PlaylistViewHandler_getPlaylist;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const SetViewHandler_1 = __importDefault(require("./SetViewHandler"));
const renderers_1 = require("./renderers");
class PlaylistViewHandler extends SetViewHandler_1.default {
    constructor() {
        super(...arguments);
        _PlaylistViewHandler_instances.add(this);
    }
    getSetIdFromView() {
        return this.currentView.playlistId;
    }
    getSet(id) {
        return __classPrivateFieldGet(this, _PlaylistViewHandler_instances, "m", _PlaylistViewHandler_getPlaylist).call(this, id);
    }
    getSets(modelParams) {
        return this.getModel(model_1.ModelType.Playlist).getPlaylists(modelParams);
    }
    getSetsListTitle() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS');
    }
    getSetRenderer() {
        return this.getRenderer(renderers_1.RendererType.Playlist);
    }
    getVisitLinkTitle() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_VISIT_LINK_PLAYLIST');
    }
    getTrackOrigin(set) {
        if (set.type === 'playlist' && set.id) {
            return {
                type: 'playlist',
                playlistId: set.id
            };
        }
        else if (set.type === 'system-playlist' && set.id && set.urn) {
            return {
                type: 'system-playlist',
                playlistId: set.id,
                urn: set.urn
            };
        }
        return null;
    }
}
exports.default = PlaylistViewHandler;
_PlaylistViewHandler_instances = new WeakSet(), _PlaylistViewHandler_getPlaylist = async function _PlaylistViewHandler_getPlaylist(playlistId) {
    const { type, pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const loadAllTracks = SoundCloudContext_1.default.getConfigValue('loadFullPlaylistAlbum');
    const id = type === 'system' ? playlistId : Number(playlistId);
    const modelParams = { loadTracks: true };
    if (type !== undefined) {
        modelParams.type = type;
    }
    if (Number(pageToken)) {
        modelParams.tracksOffset = Number(pageToken);
    }
    if (!loadAllTracks) {
        modelParams.tracksLimit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
    }
    const playlist = await this.getModel(model_1.ModelType.Playlist).getPlaylist(id, modelParams);
    if (!playlist) {
        throw Error('Failed to fetch playlist');
    }
    return {
        set: playlist,
        tracksOffset: modelParams.tracksOffset,
        tracksLimit: modelParams.tracksLimit
    };
};
//# sourceMappingURL=PlaylistViewHandler.js.map