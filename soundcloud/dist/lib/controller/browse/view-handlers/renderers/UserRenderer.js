"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../../SoundCloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class UserRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (typeof data.id !== 'number' || !data.id || !data.username) {
            return null;
        }
        const userView = {
            name: 'users',
            userId: data.id.toString()
        };
        return {
            service: 'soundcloud',
            type: 'folder',
            title: data.username,
            artist: data.fullName || data.location,
            album: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_USER_PARSER_ALBUM'),
            albumart: data.thumbnail || this.getAvatarIcon(),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`
        };
    }
    renderToHeader(data) {
        return {
            uri: this.uri,
            service: 'soundcloud',
            type: 'album',
            title: data.username,
            artist: data.fullName,
            year: data.location,
            albumart: data.thumbnail || this.getAvatarIcon()
        };
    }
}
exports.default = UserRenderer;
//# sourceMappingURL=UserRenderer.js.map