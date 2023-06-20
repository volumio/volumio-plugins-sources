"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const JellyfinContext_1 = __importDefault(require("../../../../JellyfinContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class PlaylistRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const songView = {
            name: 'songs',
            playlistId: data.id
        };
        return {
            service: 'jellyfin',
            type: 'folder',
            title: data.name,
            albumart: this.getAlbumArt(data),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`
        };
    }
    renderToHeader(data) {
        const header = super.renderToHeader(data) || {};
        header.artist = JellyfinContext_1.default.getI18n('JELLYFIN_PLAYLIST');
        return header;
    }
}
exports.default = PlaylistRenderer;
//# sourceMappingURL=PlaylistRenderer.js.map