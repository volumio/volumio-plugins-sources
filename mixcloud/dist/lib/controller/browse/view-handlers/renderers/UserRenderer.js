"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../../MixcloudContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class UserRenderer extends BaseRenderer_1.default {
    renderToListItem(user) {
        const userView = {
            name: 'user',
            username: user.username
        };
        const result = {
            service: 'mixcloud',
            type: 'folder',
            title: user.name || user.username,
            albumart: user.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`
        };
        if (user.location) {
            result.artist = user.location;
        }
        return result;
    }
    renderToHeader(user) {
        const view = { ...this.currentView };
        if (view.name === 'user' && view.playTarget) {
            delete view.playTarget;
        }
        const uri = ViewHelper_1.default.constructUriFromViews([...this.previousViews, view]);
        const result = {
            uri,
            service: 'mixcloud',
            type: 'song',
            title: user.name || user.username,
            artist: MixcloudContext_1.default.getI18n('MIXCLOUD_HEADER_USER'),
            albumart: user.thumbnail
        };
        if (user.location) {
            result.year = user.location;
        }
        return result;
    }
}
exports.default = UserRenderer;
//# sourceMappingURL=UserRenderer.js.map