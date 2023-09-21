"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importDefault(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class ShowRenderer extends BaseRenderer_1.default {
    renderToListItem(data, playOnClick = false) {
        if (!data.url) {
            return null;
        }
        const showView = {
            name: 'show',
            showUrl: data.url
        };
        const result = {
            service: 'bandcamp',
            type: 'folder',
            title: data.name,
            artist: UIHelper_1.default.reformatDate(data.date),
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(showView)}`
        };
        if (playOnClick) {
            result.type = 'song';
            result.title = BandcampContext_1.default.getI18n('BANDCAMP_SHOW_PLAY_FULL');
            result.uri = this.uri;
            result.duration = data.duration;
            delete result.artist;
        }
        return result;
    }
    renderToHeader(data) {
        return {
            'uri': this.uri,
            'service': 'bandcamp',
            'type': 'song',
            'title': data.name,
            'artist': BandcampContext_1.default.getI18n('BANDCAMP_HEADER_SHOW'),
            'year': data.date,
            'duration': data.description,
            'albumart': data.thumbnail
        };
    }
}
exports.default = ShowRenderer;
//# sourceMappingURL=ShowRenderer.js.map