"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MusicFolderRenderer_1 = __importDefault(require("./MusicFolderRenderer"));
class PlaylistRenderer extends MusicFolderRenderer_1.default {
    getTargetViewForListItem(data) {
        const endpoints = {
            watch: data.endpoint,
            browse: data.browseEndpoint
        };
        const targetView = {
            name: 'playlist',
            endpoints
        };
        return targetView;
    }
    getTargetViewForHeader(data) {
        if (!data.endpoint) {
            return null;
        }
        const targetView = {
            name: 'generic',
            endpoint: data.endpoint
        };
        return targetView;
    }
    getSubtitleForListItem(data) {
        return data.subtitle;
    }
    getSubtitleForHeader(data) {
        return data.author?.name;
    }
}
exports.default = PlaylistRenderer;
//# sourceMappingURL=PlaylistRenderer.js.map