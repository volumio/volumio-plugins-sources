"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _ExplodeHelper_getTrackUri;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
class ExplodeHelper {
    static createQueueItemFromExplodedTrackInfo(data) {
        const uri = __classPrivateFieldGet(this, _a, "m", _ExplodeHelper_getTrackUri).call(this, data);
        if (!data.title || !uri) {
            return null;
        }
        let artistLabel;
        let albumLabel = data.album || SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
        switch (data.playableState) {
            case 'blocked':
                artistLabel = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
                albumLabel = undefined;
                break;
            case 'snipped':
                artistLabel = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRACK_EXPLODE_SNIPPED');
                if (data.user?.username) {
                    artistLabel += ` ${data.user.username}`;
                }
                break;
            default:
                artistLabel = data.user?.username || undefined;
        }
        const result = {
            service: 'soundcloud',
            uri,
            albumart: data.thumbnail || undefined,
            artist: artistLabel,
            album: albumLabel,
            name: data.title,
            title: data.title
        };
        return result;
    }
}
exports.default = ExplodeHelper;
_a = ExplodeHelper, _ExplodeHelper_getTrackUri = function _ExplodeHelper_getTrackUri(data) {
    if (data.id === undefined) {
        return null;
    }
    const trackView = {
        name: 'track',
        trackId: data.id.toString()
    };
    if (data.origin) {
        trackView.origin = data.origin;
    }
    const uri = `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`;
    SoundCloudContext_1.default.getLogger().info(`[soundcloud] getTrackUri(): ${uri}`);
    return uri;
};
//# sourceMappingURL=ExplodeHelper.js.map