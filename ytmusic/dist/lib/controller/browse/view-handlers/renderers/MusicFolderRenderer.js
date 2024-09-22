"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class MusicFolderRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const targetView = this.getTargetViewForListItem(data);
        if (!targetView) {
            return null;
        }
        return {
            service: 'ytmusic',
            type: 'folder',
            title: data.title,
            albumart: data.thumbnail,
            artist: this.getSubtitleForListItem(data),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
    renderToHeader(data) {
        const targetView = this.getTargetViewForHeader(data);
        if (!targetView) {
            return null;
        }
        return {
            service: 'ytmusic',
            type: 'playlist',
            uri: `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            title: data.title,
            artist: this.getSubtitleForHeader(data),
            duration: data.subtitles?.join(' • '),
            albumart: data.thumbnail
        };
    }
}
exports.default = MusicFolderRenderer;
//# sourceMappingURL=MusicFolderRenderer.js.map