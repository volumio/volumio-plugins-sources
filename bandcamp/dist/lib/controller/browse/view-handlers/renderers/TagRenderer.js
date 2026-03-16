"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class TagRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const discoverView = {
            name: 'discover',
            customTags: data.value
        };
        return {
            service: 'bandcamp',
            type: 'item-no-menu',
            title: data.name,
            icon: 'fa',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(discoverView)}`
        };
    }
    renderGenreListItem(data) {
        const discoverView = {
            name: 'discover',
            customTags: data.value
        };
        return {
            service: 'bandcamp',
            type: 'folder',
            title: data.name,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(discoverView)}`
        };
    }
    renderToHeader(data) {
        return {
            uri: this.uri,
            service: 'bandcamp',
            type: 'song',
            title: data.name,
            artist: BandcampContext_1.default.getI18n('BANDCAMP_HEADER_TAG')
        };
    }
}
exports.default = TagRenderer;
//# sourceMappingURL=TagRenderer.js.map