"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExplodeHelper_1 = __importDefault(require("../../../../util/ExplodeHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class VideoRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const explodeTrackData = ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(data);
        const targetView = {
            name: 'video',
            explodeTrackData: ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(data)
        };
        return {
            service: 'youtube2',
            type: 'song',
            title: explodeTrackData.title,
            artist: explodeTrackData.artist,
            albumart: explodeTrackData.albumart,
            duration: data.duration,
            uri: `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
}
exports.default = VideoRenderer;
//# sourceMappingURL=VideoRenderer.js.map