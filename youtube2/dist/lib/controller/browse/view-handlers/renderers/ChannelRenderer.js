"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class ChannelRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const targetView = {
            name: 'generic',
            endpoint: data.endpoint
        };
        return {
            service: 'youtube2',
            type: 'folder',
            title: data.name,
            artist: data.subscribers,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
    renderToHeader(data) {
        const targetView = {
            name: 'generic',
            endpoint: data.endpoint
        };
        const result = {
            uri: `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            service: 'youtube2',
            type: 'album',
            title: data.title,
            duration: data.subtitles?.join(' • '),
            albumart: data.thumbnail
        };
        if (data.description) {
            result.artist = data.description;
        }
        return result;
    }
}
exports.default = ChannelRenderer;
//# sourceMappingURL=ChannelRenderer.js.map