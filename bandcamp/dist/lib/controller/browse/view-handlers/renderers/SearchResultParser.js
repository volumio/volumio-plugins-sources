"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class SearchResultRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (!data.url) {
            return null;
        }
        const result = {
            service: 'bandcamp',
            uri: '',
            type: 'folder',
            title: this.addType(data.type, data.name),
            albumart: data.thumbnail
        };
        let view;
        switch (data.type) {
            case 'artist':
                view = {
                    name: 'band',
                    bandUrl: data.url
                };
                result.type = 'folder';
                result.artist = data.location;
                break;
            case 'label':
                view = {
                    name: 'band',
                    bandUrl: data.url
                };
                result.type = 'folder';
                break;
            case 'album':
                view = {
                    name: 'album',
                    albumUrl: data.url
                };
                result.type = 'folder';
                result.artist = data.artist?.name;
                break;
            case 'track':
                view = {
                    name: 'track',
                    trackUrl: data.url
                };
                result.type = 'folder';
                result.artist = data.artist?.name;
                result.album = data.album?.name;
        }
        result.uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(view)}`;
        return result;
    }
}
exports.default = SearchResultRenderer;
//# sourceMappingURL=SearchResultParser.js.map