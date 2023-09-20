"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../../SoundCloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const SetRenderer_1 = __importDefault(require("./SetRenderer"));
class PlaylistRenderer extends SetRenderer_1.default {
    getListItemUri(data) {
        const playlistView = {
            name: 'playlists',
            playlistId: data.id?.toString()
        };
        if (data.type === 'system-playlist') {
            playlistView.type = 'system';
        }
        return `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(playlistView)}`;
    }
    getListItemAlbum() {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_PLAYLIST_PARSER_ALBUM');
    }
}
exports.default = PlaylistRenderer;
//# sourceMappingURL=PlaylistRenderer.js.map