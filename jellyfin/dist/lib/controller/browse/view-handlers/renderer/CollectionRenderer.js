"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class CollectionRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const collectionView = {
            name: 'collection',
            parentId: data.id
        };
        return {
            service: 'jellyfin',
            type: 'streaming-category',
            title: data.name,
            artist: String(data.year),
            albumart: this.getAlbumArt(data),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(collectionView)}`
        };
    }
}
exports.default = CollectionRenderer;
//# sourceMappingURL=CollectionRenderer.js.map