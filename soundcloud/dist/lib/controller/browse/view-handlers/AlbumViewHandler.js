"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumViewHandler_instances, _AlbumViewHandler_getAlbum;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const SetViewHandler_1 = __importDefault(require("./SetViewHandler"));
const renderers_1 = require("./renderers");
class AlbumViewHandler extends SetViewHandler_1.default {
    constructor() {
        super(...arguments);
        _AlbumViewHandler_instances.add(this);
    }
    getSetIdFromView() {
        return Number(this.currentView.albumId);
    }
    getSet(id) {
        return __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getAlbum).call(this, id);
    }
    getSets(modelParams) {
        return this.getModel(model_1.ModelType.Album).getAlbums(modelParams);
    }
    getSetsListTitle() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS');
    }
    getSetRenderer() {
        return this.getRenderer(renderers_1.RendererType.Album);
    }
    getVisitLinkTitle() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_VISIT_LINK_ALBUM');
    }
    getTrackOrigin(set) {
        if (set.id) {
            return {
                type: 'album',
                albumId: set.id
            };
        }
        return null;
    }
}
exports.default = AlbumViewHandler;
_AlbumViewHandler_instances = new WeakSet(), _AlbumViewHandler_getAlbum = async function _AlbumViewHandler_getAlbum(albumId) {
    const { pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const loadAllTracks = SoundCloudContext_1.default.getConfigValue('loadFullPlaylistAlbum');
    const modelParams = { loadTracks: true };
    if (Number(pageToken)) {
        modelParams.tracksOffset = Number(pageToken);
    }
    if (!loadAllTracks) {
        modelParams.tracksLimit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
    }
    const album = await this.getModel(model_1.ModelType.Album).getAlbum(albumId, modelParams);
    if (!album) {
        throw Error('Failed to fetch album');
    }
    return {
        set: album,
        tracksOffset: modelParams.tracksOffset,
        tracksLimit: modelParams.tracksLimit
    };
};
//# sourceMappingURL=AlbumViewHandler.js.map