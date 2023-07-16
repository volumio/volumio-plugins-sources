"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumViewHandler_instances, _AlbumViewHandler_addArtistLink;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class AlbumViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _AlbumViewHandler_instances.add(this);
    }
    async browse() {
        const albumUrl = this.currentView.albumUrl;
        if (!albumUrl) {
            throw Error('Album URL missing');
        }
        return this.browseAlbum(albumUrl);
    }
    async browseAlbum(albumUrl) {
        const model = this.getModel(model_1.ModelType.Album);
        const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
        const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
        const albumInfo = await model.getAlbum(albumUrl);
        const trackItems = albumInfo.tracks?.reduce((result, track) => {
            const parsed = trackRenderer.renderToListItem({ ...track, type: 'track' });
            if (parsed) {
                result.push(parsed);
            }
            return result;
        }, []);
        const header = albumRenderer.renderToHeader(albumInfo);
        const page = {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                info: header,
                lists: [{
                        availableListViews: ['list'],
                        items: trackItems || []
                    }]
            }
        };
        await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_addArtistLink).call(this, page.navigation, albumInfo.artist?.url);
        const link = {
            url: albumUrl,
            text: BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_ALBUM'),
            icon: { type: 'bandcamp' },
            target: '_blank'
        };
        if (page.navigation?.lists) {
            if (page.navigation?.lists.length > 1) { // Artist link added
                page.navigation.lists[1].title = UIHelper_1.default.constructListTitleWithLink('', link, false);
            }
            else {
                page.navigation.lists[0].title = UIHelper_1.default.constructListTitleWithLink('', link, true);
            }
        }
        return page;
    }
    async getTracksOnExplode() {
        const albumUrl = this.currentView.albumUrl;
        if (!albumUrl) {
            throw Error('No albumUrl specified');
        }
        const model = this.getModel(model_1.ModelType.Album);
        const albumInfo = await model.getAlbum(albumUrl);
        const albumTracks = albumInfo.tracks;
        const trackPosition = this.currentView.track;
        if (albumTracks && trackPosition) {
            return albumTracks[parseInt(trackPosition, 10) - 1] || [];
        }
        return albumTracks || [];
    }
}
exports.default = AlbumViewHandler;
_AlbumViewHandler_instances = new WeakSet(), _AlbumViewHandler_addArtistLink = async function _AlbumViewHandler_addArtistLink(nav, artistUrl) {
    if (!nav || !artistUrl) {
        return;
    }
    // Check if we're coming from band view.
    // If not, include artist link.
    const comingFrom = this.previousViews[this.previousViews.length - 1]?.name;
    if (comingFrom !== 'band') {
        const model = this.getModel(model_1.ModelType.Band);
        const bandInfo = await model.getBand(artistUrl);
        if (!bandInfo.url) {
            return;
        }
        const bandView = {
            name: 'band',
            bandUrl: bandInfo.url
        };
        const artistLinkItem = {
            service: 'bandcamp',
            type: 'item-no-menu',
            icon: 'fa fa-user',
            title: BandcampContext_1.default.getI18n('BANDCAMP_MORE_FROM', bandInfo.name),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(bandView)}`
        };
        const linksList = {
            availableListViews: ['list'],
            items: [artistLinkItem]
        };
        if (!nav.lists) {
            nav.lists = [];
        }
        nav.lists.unshift(linksList);
    }
};
//# sourceMappingURL=AlbumViewHandler.js.map