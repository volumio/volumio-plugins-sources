"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importDefault(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class AlbumRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (!data.url) {
            return null;
        }
        const albumView = {
            name: 'album',
            albumUrl: data.url
        };
        return {
            service: 'bandcamp',
            type: 'folder',
            title: this.addType('album', data.name),
            artist: data.artist?.name,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`
        };
    }
    renderToHeader(data) {
        return {
            uri: this.uri,
            service: 'bandcamp',
            type: 'song',
            album: data.name,
            artist: data.artist?.name,
            albumart: data.thumbnail,
            year: data.releaseDate ? UIHelper_1.default.reformatDate(data.releaseDate) : null
        };
    }
}
exports.default = AlbumRenderer;
//# sourceMappingURL=AlbumRenderer.js.map