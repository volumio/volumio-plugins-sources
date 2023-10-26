"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class AlbumRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const songsView = {
            name: 'songs',
            albumId: data.id
        };
        return {
            service: 'jellyfin',
            type: 'folder',
            title: data.name,
            artist: data.albumArtist,
            duration: data.duration,
            albumart: this.getAlbumArt(data),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(songsView)}`
        };
    }
    renderToHeader(data) {
        const header = super.renderToHeader(data) || {};
        header.artist = data.albumArtist;
        header.year = data.year;
        // Duration does not get converted into time format when shown in header
        // (as opposed to list item). So we have to do it ourselves.
        header.duration = this.timeFormat(data.duration);
        header.genre = this.getStringFromIdNamePair(data.genres);
        return header;
    }
}
exports.default = AlbumRenderer;
//# sourceMappingURL=AlbumRenderer.js.map