"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importDefault(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class TrackRenderer extends BaseRenderer_1.default {
    renderToListItem(data, addType = false, fakeAlbum = false, addNonPlayableText = true) {
        if (!data.url) {
            return null;
        }
        const trackView = {
            name: 'track',
            trackUrl: data.url
        };
        const result = {
            service: 'bandcamp',
            type: fakeAlbum ? 'folder' : 'song',
            title: addType ? this.addType('track', data.name) : data.name,
            artist: data.artist?.name,
            album: data.album?.name,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`,
            albumart: data.thumbnail
        };
        if (!fakeAlbum) {
            result.duration = data.duration;
        }
        if (!data.streamUrl && addNonPlayableText) {
            result.title = UIHelper_1.default.addNonPlayableText(result.title);
        }
        return result;
    }
    renderToHeader(data) {
        return {
            service: 'bandcamp',
            uri: this.uri,
            type: 'song',
            album: data.name,
            artist: data.artist?.name,
            albumart: data.thumbnail
        };
    }
}
exports.default = TrackRenderer;
//# sourceMappingURL=TrackRenderer.js.map