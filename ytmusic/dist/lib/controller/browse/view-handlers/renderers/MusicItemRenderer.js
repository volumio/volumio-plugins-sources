"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExplodeHelper_1 = __importDefault(require("../../../../util/ExplodeHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class MusicItemRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const explodeTrackData = ExplodeHelper_1.default.getExplodedTrackInfoFromMusicItem(data);
        const targetView = {
            name: data.type,
            explodeTrackData: ExplodeHelper_1.default.getExplodedTrackInfoFromMusicItem(data)
        };
        return {
            service: 'ytmusic',
            type: 'song',
            tracknumber: data.trackNumber,
            title: data.title,
            artist: data.subtitle || explodeTrackData.artist,
            album: data.album?.title,
            albumart: data.thumbnail,
            duration: data.duration,
            uri: `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
}
exports.default = MusicItemRenderer;
//# sourceMappingURL=MusicItemRenderer.js.map