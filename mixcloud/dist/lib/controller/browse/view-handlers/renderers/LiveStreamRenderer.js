"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const MixcloudContext_1 = __importDefault(require("../../../../MixcloudContext"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class LiveStreamRenderer extends BaseRenderer_1.default {
    renderToListItem(liveStream, asType = 'folder') {
        if (!liveStream.isLive || !liveStream.owner) {
            return null;
        }
        let type;
        let title;
        let album;
        let artist;
        let duration;
        let albumart;
        let icon;
        let uri;
        switch (asType) {
            case 'folder':
                type = 'folder';
                title = liveStream.name;
                album = MixcloudContext_1.default.getI18n('MIXCLOUD_LIVE_STREAM');
                artist = liveStream.owner?.name || liveStream.owner?.username;
                albumart = liveStream.thumbnail;
                const userView = {
                    name: 'user',
                    username: liveStream.owner.username,
                    playTarget: 'liveStream'
                };
                uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`;
                break;
            case 'playLiveStreamItem':
                const liveStreamView = {
                    name: 'liveStream',
                    username: liveStream.owner.username
                };
                const playUri = ViewHelper_1.default.constructUriFromViews([...this.previousViews, liveStreamView]);
                type = 'song';
                title = liveStream.name;
                artist = liveStream.owner?.name || liveStream.owner?.username;
                albumart = liveStream.thumbnail;
                uri = playUri;
                break;
        }
        return {
            service: 'mixcloud',
            type,
            title,
            album,
            artist,
            duration,
            albumart,
            icon,
            uri
        };
    }
}
exports.default = LiveStreamRenderer;
//# sourceMappingURL=LiveStreamRenderer.js.map