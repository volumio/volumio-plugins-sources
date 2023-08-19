"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../../SoundCloudContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class SetRenderer extends BaseRenderer_1.default {
    renderToListItem(data, showIcon = false) {
        if (data.id === undefined || data.id === null || data.id === '' || !data.title) {
            return null;
        }
        const result = {
            service: 'soundcloud',
            type: 'folder',
            title: data.title,
            artist: data.user?.username,
            album: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_PLAYLIST_PARSER_ALBUM'),
            albumart: data.thumbnail || this.getSoundCloudIcon(),
            uri: this.getListItemUri(data)
        };
        if (showIcon) {
            let iconClass, scale;
            if (data.isLiked !== undefined && data.isLiked) {
                iconClass = 'fa-heart';
                scale = 0.9;
            }
            else if (data.isPublic !== undefined && !data.isPublic) {
                iconClass = 'fa-lock';
                scale = 1;
            }
            else {
                iconClass = null;
            }
            if (iconClass) {
                result.title = `<i class='fa ${iconClass}' style='margin-right: 3px; scale: ${scale};'></i> ${result.title}`;
            }
        }
        return result;
    }
    renderToHeader(data) {
        return {
            'uri': this.uri,
            'service': 'soundcloud',
            'type': 'album',
            'title': data.title,
            'artist': data.user?.username,
            'year': data.user?.fullName !== data.user?.username ? data.user?.fullName : null,
            'duration': data.user?.location,
            'albumart': data.thumbnail || this.getSoundCloudIcon()
        };
    }
}
exports.default = SetRenderer;
//# sourceMappingURL=SetRenderer.js.map