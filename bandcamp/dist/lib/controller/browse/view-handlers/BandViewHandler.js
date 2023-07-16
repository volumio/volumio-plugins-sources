"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BandViewHandler_instances, _BandViewHandler_getContentListsForArtist, _BandViewHandler_getContentListsForLabel, _BandViewHandler_getDiscographyList, _BandViewHandler_getLabelArtistsList, _BandViewHandler_getViewLinkText;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class BandViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _BandViewHandler_instances.add(this);
    }
    async browse() {
        const bandUrl = this.currentView.bandUrl;
        const bandInfo = await this.getModel(model_1.ModelType.Band).getBand(bandUrl);
        const header = this.getRenderer(renderers_1.RendererType.Band).renderToHeader(bandInfo);
        let backToList = null;
        if (bandInfo.type === 'artist' && bandInfo.label?.url) {
            // Check if we're coming from the label:
            // Label -> artist ; or
            // Label -> album -> artist
            const _getBackToUri = (labelUrl, matchLevel) => {
                const prevViews = this.previousViews;
                const viewToMatch = prevViews[prevViews.length - (matchLevel + 1)];
                if (viewToMatch && viewToMatch.name === 'band' && viewToMatch.bandUrl === labelUrl) {
                    return ViewHelper_1.default.constructUriFromViews(prevViews.slice(0, prevViews.length - matchLevel));
                }
                return null;
            };
            let labelLinkListItem;
            const backToUri = _getBackToUri(bandInfo.label.url, 0) || _getBackToUri(bandInfo.label.url, 1);
            if (backToUri) {
                labelLinkListItem = {
                    service: 'bandcamp',
                    type: 'item-no-menu',
                    title: BandcampContext_1.default.getI18n('BANDCAMP_BACK_TO', bandInfo.label.name),
                    uri: backToUri
                };
            }
            else {
                const bandView = {
                    name: 'band',
                    bandUrl: bandInfo.label.url
                };
                labelLinkListItem = {
                    service: 'bandcamp',
                    type: 'item-no-menu',
                    title: bandInfo.label.name,
                    uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(bandView)}`
                };
            }
            labelLinkListItem.icon = 'fa fa-link';
            backToList = {
                availableListViews: ['list'],
                items: [labelLinkListItem]
            };
        }
        let contentLists;
        switch (bandInfo.type) {
            case 'artist':
                contentLists = await __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getContentListsForArtist).call(this, bandUrl);
                break;
            case 'label':
                contentLists = await __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getContentListsForLabel).call(this, bandUrl);
                break;
            default:
                contentLists = [];
        }
        if (backToList) {
            contentLists.unshift(backToList);
        }
        const viewBandExternalLink = {
            url: bandUrl,
            text: __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getViewLinkText).call(this, bandInfo.type),
            icon: { type: 'bandcamp' },
            target: '_blank'
        };
        if (contentLists.length > 1) {
            contentLists[1].title = UIHelper_1.default.constructListTitleWithLink(contentLists[1].title || '', viewBandExternalLink, false);
        }
        else {
            contentLists[0].title = UIHelper_1.default.constructListTitleWithLink(contentLists[0].title || '', viewBandExternalLink, true);
        }
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                info: header,
                lists: contentLists
            }
        };
    }
    async getTracksOnExplode() {
        const bandUrl = this.currentView.bandUrl;
        if (!bandUrl) {
            throw Error('Band URL is missing');
        }
        const modelParams = {
            limit: 1,
            bandUrl
        };
        const discog = await this.getModel(model_1.ModelType.Band).getDiscography(modelParams);
        const first = discog.items[0] || {};
        if (first.type === 'track' && first.url) {
            const trackModel = this.getModel(model_1.ModelType.Track);
            return trackModel.getTrack(first.url);
        }
        else if (first.type === 'album' && first.url) {
            const albumModel = this.getModel(model_1.ModelType.Album);
            const album = await albumModel.getAlbum(first.url);
            return album.tracks || [];
        }
        return [];
    }
}
exports.default = BandViewHandler;
_BandViewHandler_instances = new WeakSet(), _BandViewHandler_getContentListsForArtist = async function _BandViewHandler_getContentListsForArtist(artistUrl) {
    return [await __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getDiscographyList).call(this, artistUrl)];
}, _BandViewHandler_getContentListsForLabel = async function _BandViewHandler_getContentListsForLabel(labelUrl) {
    let contentsList;
    let viewLinkListItem;
    if (this.currentView.view === 'artists') {
        contentsList = await __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getLabelArtistsList).call(this, labelUrl);
        const bandView = {
            name: 'band',
            bandUrl: labelUrl,
            view: 'discography'
        };
        viewLinkListItem = {
            service: 'bandcamp',
            type: 'item-no-menu',
            icon: 'fa fa-music',
            title: BandcampContext_1.default.getI18n('BANDCAMP_DISCOGRAPHY'),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(bandView)}`
        };
    }
    else {
        contentsList = await __classPrivateFieldGet(this, _BandViewHandler_instances, "m", _BandViewHandler_getDiscographyList).call(this, labelUrl);
        const bandView = {
            name: 'band',
            bandUrl: labelUrl,
            view: 'artists'
        };
        viewLinkListItem = {
            service: 'bandcamp',
            type: 'item-no-menu',
            icon: 'fa fa-users',
            title: BandcampContext_1.default.getI18n('BANDCAMP_LABEL_ARTISTS'),
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(bandView)}`
        };
    }
    const linksList = {
        availableListViews: ['list'],
        items: [viewLinkListItem]
    };
    return [linksList, contentsList];
}, _BandViewHandler_getDiscographyList = async function _BandViewHandler_getDiscographyList(bandUrl) {
    const view = this.currentView;
    const model = this.getModel(model_1.ModelType.Band);
    const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
    const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
    const modelParams = {
        bandUrl,
        limit: BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    const discog = await model.getDiscography(modelParams);
    const listItems = discog.items.reduce((result, discogItem) => {
        let rendered;
        if (discogItem.type === 'album') {
            rendered = albumRenderer.renderToListItem(discogItem);
        }
        else { // Track
            rendered = trackRenderer.renderToListItem(discogItem, true, true, false);
        }
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(discog.nextPageToken, discog.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        title: BandcampContext_1.default.getI18n('BANDCAMP_DISCOGRAPHY'),
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _BandViewHandler_getLabelArtistsList = async function _BandViewHandler_getLabelArtistsList(labelUrl) {
    const modelParams = {
        labelUrl,
        limit: BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (this.currentView.pageRef) {
        modelParams.pageToken = this.currentView.pageRef.pageToken;
        modelParams.pageOffset = this.currentView.pageRef.pageOffset;
    }
    const artists = await this.getModel(model_1.ModelType.Band).getLabelArtists(modelParams);
    const artistRenderer = this.getRenderer(renderers_1.RendererType.Band);
    const listItems = artists.items.reduce((result, artist) => {
        const rendered = artistRenderer.renderToListItem(artist);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(artists.nextPageToken, artists.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        title: BandcampContext_1.default.getI18n('BANDCAMP_LABEL_ARTISTS'),
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _BandViewHandler_getViewLinkText = function _BandViewHandler_getViewLinkText(bandType) {
    switch (bandType) {
        case 'artist':
            return BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_ARTIST');
        case 'label':
            return BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_LABEL');
        default:
            return '';
    }
};
//# sourceMappingURL=BandViewHandler.js.map