"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../../SoundCloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const SetRenderer_1 = __importDefault(require("./SetRenderer"));
class AlbumRenderer extends SetRenderer_1.default {
    getListItemUri(data) {
        const albumView = {
            name: 'albums',
            albumId: data.id?.toString()
        };
        return `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
    }
    getListItemAlbum() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_ALBUM_PARSER_ALBUM');
    }
}
exports.default = AlbumRenderer;
//# sourceMappingURL=AlbumRenderer.js.map