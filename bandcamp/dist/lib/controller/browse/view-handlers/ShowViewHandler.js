"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ShowViewHandler_instances, _ShowViewHandler_browseAllShows, _ShowViewHandler_browseShow, _ShowViewHandler_constructUriWithParams, _ShowViewHandler_checkAndAddSwitchViewListItem;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class ShowViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _ShowViewHandler_instances.add(this);
    }
    async browse() {
        const showUrl = this.currentView.showUrl;
        if (showUrl) {
            return __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_browseShow).call(this, showUrl);
        }
        return __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_browseAllShows).call(this);
    }
    async getTracksOnExplode() {
        const showUrl = this.currentView.showUrl;
        if (!showUrl) {
            throw Error('Show URL missing');
        }
        const show = await this.getModel(model_1.ModelType.Show).getShow(showUrl);
        return {
            type: 'track',
            name: show.name,
            streamUrl: show.streamUrl,
            thumbnail: show.thumbnail,
            artist: {
                type: 'artist',
                name: UIHelper_1.default.reformatDate(show.date)
            },
            album: {
                type: 'album',
                name: BandcampContext_1.default.getI18n('BANDCAMP_HEADER_SHOW')
            },
            showUrl: show.url
        };
    }
    /**
     * Override
     *
     * Track uri:
     * bandcamp/show@showUrl={showUrl}
     */
    getTrackUri(track) {
        const showView = {
            name: 'show',
            showUrl: track.showUrl
        };
        return `bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(showView)}`;
    }
}
exports.default = ShowViewHandler;
_ShowViewHandler_instances = new WeakSet(), _ShowViewHandler_browseAllShows = async function _ShowViewHandler_browseAllShows() {
    const view = this.currentView;
    const modelParams = {
        limit: view.inSection ? BandcampContext_1.default.getConfigValue('itemsPerSection', 5) : BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    const shows = await this.getModel(model_1.ModelType.Show).getShows(modelParams);
    const showRenderer = this.getRenderer(renderers_1.RendererType.Show);
    const listItems = shows.items.reduce((result, show) => {
        const rendered = showRenderer.renderToListItem(show);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(shows.nextPageToken, shows.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists: [{
                    title: UIHelper_1.default.addBandcampIconToListTitle(BandcampContext_1.default.getI18n(view.inSection ? 'BANDCAMP_SHOWS_SHORT' : 'BANDCAMP_SHOWS')),
                    availableListViews: ['list', 'grid'],
                    items: listItems
                }]
        }
    };
}, _ShowViewHandler_browseShow = async function _ShowViewHandler_browseShow(showUrl) {
    const view = this.currentView;
    const trackModel = this.getModel(model_1.ModelType.Track);
    const allLists = [];
    const show = await this.getModel(model_1.ModelType.Show).getShow(showUrl);
    const showRenderer = this.getRenderer(renderers_1.RendererType.Show);
    const showListItem = showRenderer.renderToListItem(show, true);
    if (showListItem) {
        const viewShowExternalLink = {
            url: showUrl,
            text: BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_SHOW'),
            icon: { type: 'bandcamp' },
            target: '_blank'
        };
        const playFullStreamLinkList = {
            title: UIHelper_1.default.constructListTitleWithLink('', viewShowExternalLink, true),
            availableListViews: ['list'],
            items: [showListItem]
        };
        allLists.push(playFullStreamLinkList);
    }
    if (view.view === 'albums') {
        const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
        const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
        const switchViewLinkData = {
            uri: __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_constructUriWithParams).call(this, { view: 'tracks', noExplode: 1 }),
            text: BandcampContext_1.default.getI18n('BANDCAMP_SHOW_FEATURED_TRACKS')
        };
        const switchViewLink = {
            url: '#',
            text: switchViewLinkData.text,
            onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${switchViewLinkData.uri}'}, true)`,
            icon: {
                type: 'fa',
                class: 'fa fa-arrow-circle-right',
                float: 'right',
                color: '#54c688'
            }
        };
        const featuredAlbumsList = {
            title: UIHelper_1.default.constructListTitleWithLink(BandcampContext_1.default.getI18n('BANDCAMP_TRACK_SOURCES'), switchViewLink, false),
            availableListViews: ['list', 'grid'],
            items: []
        };
        const _fetchAlbumOrTrackPromise = async (track) => {
            if (track.album) {
                return track.album;
            }
            else if (track.url) {
                try {
                    return await trackModel.getTrack(track.url);
                }
                catch (error) {
                    return null;
                }
            }
            return null;
        };
        const fetchAlbumOrTrackPromises = show.tracks?.map((track) => _fetchAlbumOrTrackPromise(track)) || [];
        const fetchedAlbumsOrTracks = (await Promise.all(fetchAlbumOrTrackPromises));
        const albumsAdded = [];
        fetchedAlbumsOrTracks.forEach((item) => {
            if (!item?.url) {
                return true;
            }
            if (item.type === 'track') {
                const rendered = trackRenderer.renderToListItem(item, true, true);
                if (rendered) {
                    featuredAlbumsList.items.push(rendered);
                }
            }
            else if (item.type === 'album' && !albumsAdded.includes(item.url)) {
                const rendered = albumRenderer.renderToListItem(item);
                if (rendered) {
                    featuredAlbumsList.items.push(rendered);
                    albumsAdded.push(item.url);
                }
            }
        });
        allLists.push(featuredAlbumsList);
        __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_checkAndAddSwitchViewListItem).call(this, switchViewLinkData, allLists);
    }
    else {
        const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
        const switchViewLinkData = {
            uri: __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_constructUriWithParams).call(this, { view: 'albums', noExplode: 1 }),
            text: BandcampContext_1.default.getI18n('BANDCAMP_SHOW_TRACK_SOURCES')
        };
        const switchViewLink = {
            url: '#',
            text: switchViewLinkData.text,
            onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${switchViewLinkData.uri}'}, true)`,
            icon: {
                type: 'fa',
                class: 'fa fa-arrow-circle-right',
                float: 'right',
                color: '#54c688'
            }
        };
        const featuredTracksList = {
            title: UIHelper_1.default.constructListTitleWithLink(BandcampContext_1.default.getI18n('BANDCAMP_FEATURED_TRACKS'), switchViewLink, false),
            availableListViews: ['list'],
            items: []
        };
        const fetchTrackPromises = show.tracks?.map(async (track) => {
            try {
                if (track.url) {
                    return await trackModel.getTrack(track.url);
                }
                return null;
            }
            catch (error) {
                return null;
            }
        });
        const tracks = fetchTrackPromises ? await Promise.all(fetchTrackPromises) : [];
        tracks.forEach((track) => {
            if (track) {
                const rendered = trackRenderer.renderToListItem(track);
                if (rendered) {
                    featuredTracksList.items.push(rendered);
                }
            }
        });
        allLists.push(featuredTracksList);
        __classPrivateFieldGet(this, _ShowViewHandler_instances, "m", _ShowViewHandler_checkAndAddSwitchViewListItem).call(this, switchViewLinkData, allLists);
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: showRenderer.renderToHeader(show),
            lists: allLists
        }
    };
}, _ShowViewHandler_constructUriWithParams = function _ShowViewHandler_constructUriWithParams(params) {
    const targetView = {
        ...this.currentView,
        ...params
    };
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
}, _ShowViewHandler_checkAndAddSwitchViewListItem = function _ShowViewHandler_checkAndAddSwitchViewListItem(linkData, allLists) {
    if (!UIHelper_1.default.supportsEnhancedTitles()) {
        // Compensate for loss of switch view link
        const switchViewListItem = {
            service: 'bandcamp',
            type: 'item-no-menu',
            uri: linkData.uri,
            title: linkData.text,
            icon: 'fa fa-arrow-circle-right'
        };
        allLists.push({
            availableListViews: ['list'],
            items: [switchViewListItem]
        });
    }
    return allLists;
};
//# sourceMappingURL=ShowViewHandler.js.map