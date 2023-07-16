"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const JellyfinContext_1 = __importDefault(require("../../../../JellyfinContext"));
const entities_1 = require("../../../../entities");
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class ArtistRenderer extends BaseRenderer_1.default {
    renderToListItem(data, options) {
        const albumView = {
            name: 'albums'
        };
        const parentId = options?.noParent ? null : this.currentView.parentId;
        if (parentId) {
            albumView.parentId = parentId;
        }
        if (data.type === entities_1.EntityType.Artist) {
            albumView.artistId = data.id;
        }
        else {
            albumView.albumArtistId = data.id;
        }
        return {
            service: 'jellyfin',
            type: 'folder',
            title: data.name,
            albumart: this.getAlbumArt(data),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`
        };
    }
    renderToHeader(data) {
        const header = super.renderToHeader(data) || {};
        header.artist = JellyfinContext_1.default.getI18n('JELLYFIN_ARTIST');
        header.year = this.getStringFromIdNamePair(data.genres);
        return header;
    }
}
exports.default = ArtistRenderer;
//# sourceMappingURL=ArtistRenderer.js.map