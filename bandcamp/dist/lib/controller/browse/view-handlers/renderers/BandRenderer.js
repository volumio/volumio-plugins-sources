"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class BandRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (!data.url) {
            return null;
        }
        const bandView = {
            name: 'band',
            bandUrl: data.url
        };
        const result = {
            service: 'bandcamp',
            type: 'folder',
            title: data.name,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(bandView)}`
        };
        if (data.location) {
            result.artist = data.location;
        }
        return result;
    }
    renderToHeader(data) {
        const result = {
            uri: this.uri,
            service: 'bandcamp',
            type: 'song',
            title: data.name,
            albumart: data.thumbnail
        };
        switch (data.type) {
            case 'artist':
                result.artist = BandcampContext_1.default.getI18n('BANDCAMP_HEADER_ARTIST');
                break;
            case 'label':
                result.artist = BandcampContext_1.default.getI18n('BANDCAMP_HEADER_LABEL');
                break;
            default:
        }
        if (data.location) {
            result.year = data.location;
        }
        if (data.type === 'artist' && data.label) {
            result.duration = data.label.name;
        }
        return result;
    }
}
exports.default = BandRenderer;
//# sourceMappingURL=BandRenderer.js.map