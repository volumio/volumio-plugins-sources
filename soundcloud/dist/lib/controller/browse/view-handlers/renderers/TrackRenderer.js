"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../../SoundCloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class TrackRenderer extends BaseRenderer_1.default {
    renderToListItem(data, origin) {
        if (typeof data.id !== 'number' || !data.id || !data.title) {
            return null;
        }
        let artistLabel;
        let albumLabel = data.album || SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
        switch (data.playableState) {
            case 'blocked':
                artistLabel = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
                albumLabel = '';
                break;
            case 'snipped':
                artistLabel = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_PARSER_SNIPPED');
                if (data.user?.username) {
                    artistLabel += ` ${data.user.username}`;
                }
                break;
            default:
                artistLabel = data.user?.username;
        }
        const trackView = {
            name: 'track',
            trackId: data.id.toString()
        };
        if (origin) {
            trackView.origin = origin;
        }
        const result = {
            service: 'soundcloud',
            type: 'song',
            title: data.title,
            artist: artistLabel,
            album: albumLabel,
            albumart: data.thumbnail || this.getSoundCloudIcon(),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`
        };
        if (data.duration !== undefined) {
            result.duration = Math.round(data.duration / 1000);
        }
        return result;
    }
}
exports.default = TrackRenderer;
//# sourceMappingURL=TrackRenderer.js.map