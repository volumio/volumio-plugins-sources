"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class SongRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const songView = {
            name: 'song',
            songId: data.id
        };
        return {
            service: 'jellyfin',
            type: 'song',
            title: data.name,
            artist: this.getStringFromIdNamePair(data.artists),
            album: data.album?.name,
            duration: data.duration,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`,
            albumart: this.getAlbumArt(data),
            favorite: data.favorite
        };
    }
    renderToHeader() {
        return null;
    }
}
exports.default = SongRenderer;
//# sourceMappingURL=SongRenderer.js.map