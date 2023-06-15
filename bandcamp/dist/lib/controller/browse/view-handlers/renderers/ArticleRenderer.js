"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importDefault(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class ArticleRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        if (!data.url) {
            return null;
        }
        const articleView = {
            name: 'article',
            articleUrl: data.url
        };
        return {
            service: 'bandcamp',
            type: 'folder',
            title: data.title,
            artist: `${data.category?.name} - ${data.date}`,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(articleView)}`
        };
    }
    renderToHeader(data) {
        return {
            uri: this.uri,
            service: 'bandcamp',
            type: 'song',
            title: data.title,
            albumart: data.thumbnail,
            artist: `${BandcampContext_1.default.getI18n('BANDCAMP_DAILY')} - ${data.category?.name}`,
            year: UIHelper_1.default.reformatDate(data.date),
            duration: data.author ? BandcampContext_1.default.getI18n('BANDCAMP_ARTICLE_BY', data.author.name) : undefined
        };
    }
    renderMediaItemTrack(article, mediaItem, track) {
        const articleView = {
            name: 'article',
            articleUrl: article.url,
            mediaItemRef: mediaItem.mediaItemRef,
            track: track.position?.toString()
        };
        return {
            service: 'bandcamp',
            type: 'song',
            title: track.name,
            album: mediaItem.name,
            artist: mediaItem.artist ? mediaItem.artist.name : '',
            albumart: mediaItem.thumbnail,
            duration: track.duration,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(articleView)}`
        };
    }
}
exports.default = ArticleRenderer;
//# sourceMappingURL=ArticleRenderer.js.map