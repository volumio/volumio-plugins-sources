"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class ServerRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const userViewView = {
            name: 'userViews',
            username: data.username,
            serverId: data.id
        };
        return {
            'service': 'jellyfin',
            'type': 'streaming-category',
            'title': `${data.username} @ ${data.name}`,
            'uri': `jellyfin/${ViewHelper_1.default.constructUriSegmentFromView(userViewView)}`,
            'albumart': '/albumart?sourceicon=music_service/jellyfin/dist/assets/images/jellyfin.png'
        };
    }
    renderToHeader() {
        return null;
    }
}
exports.default = ServerRenderer;
//# sourceMappingURL=ServerRenderer.js.map