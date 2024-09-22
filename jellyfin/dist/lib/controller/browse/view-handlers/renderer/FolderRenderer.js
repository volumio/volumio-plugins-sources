"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const Folder_1 = require("../../../../entities/Folder");
const entities_1 = require("../../../../entities");
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class FolderRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        let title;
        if (data.type === entities_1.EntityType.Folder) {
            title = `
        <div style='display: inline-flex; align-items: center;'>
            <i class='fa fa-folder-o' style='font-size: 20px; margin: -3px 8px 0 1px;'></i> <span>${data.name}</span>
        </div>
      `;
        }
        else {
            title = data.name;
        }
        const targetView = {
            name: data.folderType === Folder_1.FolderType.Collections ? 'collections' : 'folder',
            parentId: data.id
        };
        return {
            service: 'jellyfin',
            type: 'streaming-category',
            title,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            albumart: this.getAlbumArt(data)
        };
    }
}
exports.default = FolderRenderer;
//# sourceMappingURL=FolderRenderer.js.map