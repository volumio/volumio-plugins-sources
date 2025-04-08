"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class ChannelRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (!data.endpoint) {
            return null;
        }
        const targetView = {
            name: 'generic',
            endpoint: data.endpoint
        };
        return {
            service: 'ytmusic',
            type: 'folder',
            title: data.name,
            artist: data.subtitle,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
    renderToHeader(data) {
        const endpoint = data.endpoint || this.currentView.endpoint;
        if (!endpoint) {
            return null;
        }
        const targetView = {
            name: 'generic',
            endpoint
        };
        const result = {
            uri: `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            service: 'ytmusic',
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