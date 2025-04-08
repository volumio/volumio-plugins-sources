"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const JellyfinContext_1 = __importDefault(require("../../../../JellyfinContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class GenreRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const albumView = {
            name: 'albums',
            parentId: this.currentView.parentId,
            genreId: data.id
        };
        return {
            'service': 'jellyfin',
            'type': 'folder',
            'title': data.name,
            'albumart': this.getAlbumArt(data),
            'uri': `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`
        };
    }
    renderToHeader(data) {
        const header = super.renderToHeader(data) || {};
        header.artist = JellyfinContext_1.default.getI18n('JELLYFIN_GENRE');
        return header;
    }
}
exports.default = GenreRenderer;
//# sourceMappingURL=GenreRenderer.js.map