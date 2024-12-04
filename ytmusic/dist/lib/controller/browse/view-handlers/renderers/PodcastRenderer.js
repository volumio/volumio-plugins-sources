"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MusicFolderRenderer_1 = __importDefault(require("./MusicFolderRenderer"));
class PodcastRenderer extends MusicFolderRenderer_1.default {
    getTargetViewForListItem(data) {
        const endpoints = {
            watch: data.endpoint,
            browse: data.browseEndpoint
        };
        const targetView = {
            name: 'podcast',
            endpoints
        };
        return targetView;
    }
    getTargetViewForHeader(data) {
        const endpoint = data.endpoint || this.currentView.endpoints?.watch ||
            this.currentView.endpoints?.browse || this.currentView.endpoint;
        if (!endpoint) {
            return null;
        }
        const targetView = {
            name: 'generic',
            endpoint
        };
        return targetView;
    }
    getSubtitleForListItem(data) {
        return data.subtitle;
    }
    getSubtitleForHeader(data) {
        return data.description;
    }
}
exports.default = PodcastRenderer;
//# sourceMappingURL=PodcastRenderer.js.map