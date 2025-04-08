"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const MixcloudContext_1 = __importDefault(require("../../../../MixcloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class PlaylistRenderer extends BaseRenderer_1.default {
    renderToListItem(playlist) {
        const cloudcastView = {
            name: 'cloudcasts',
            playlistId: playlist.id
        };
        return {
            service: 'mixcloud',
            type: 'folder',
            title: playlist.name,
            album: MixcloudContext_1.default.getI18n('MIXCLOUD_PLAYLIST'),
            artist: playlist.owner?.name,
            albumart: playlist.owner?.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(cloudcastView)}`
        };
    }
    renderToHeader(playlist) {
        return {
            uri: this.uri,
            service: 'mixcloud',
            type: 'song',
            title: playlist.name,
            artist: MixcloudContext_1.default.getI18n('MIXCLOUD_HEADER_PLAYLIST', playlist.owner?.name),
            albumart: playlist.owner?.thumbnail
        };
    }
}
exports.default = PlaylistRenderer;
//# sourceMappingURL=PlaylistRenderer.js.map