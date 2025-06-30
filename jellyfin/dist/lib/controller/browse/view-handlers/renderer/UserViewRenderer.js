"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserView_1 = require("../../../../entities/UserView");
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class UserViewRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        let targetView;
        let type;
        switch (data.userViewType) {
            case UserView_1.UserViewType.Collections:
                targetView = {
                    name: 'collections',
                    parentId: data.id
                };
                type = 'streaming-category';
                break;
            case UserView_1.UserViewType.Playlists:
                targetView = {
                    name: 'playlists'
                };
                type = 'streaming-category';
                break;
            case UserView_1.UserViewType.Library:
                targetView = {
                    name: 'library',
                    parentId: data.id
                };
                type = 'folder';
                break;
            case UserView_1.UserViewType.Folders:
                targetView = {
                    name: 'folder',
                    parentId: data.id
                };
                type = 'streaming-category';
                break;
            default:
                return null;
        }
        return {
            service: 'jellyfin',
            type,
            title: data.name,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            albumart: this.getAlbumArt(data)
        };
    }
}
exports.default = UserViewRenderer;
//# sourceMappingURL=UserViewRenderer.js.map