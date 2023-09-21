"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FanViewHandler_instances, _FanViewHandler_browseList, _FanViewHandler_browseSummary, _FanViewHandler_getTitle;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const renderers_1 = require("./renderers");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class FanViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _FanViewHandler_instances.add(this);
    }
    browse() {
        if (!this.currentView.username) {
            throw Error('Username missing');
        }
        switch (this.currentView.view) {
            case 'collection':
            case 'wishlist':
            case 'followingArtistsAndLabels':
            case 'followingGenres':
                return __classPrivateFieldGet(this, _FanViewHandler_instances, "m", _FanViewHandler_browseList).call(this);
            default:
                return __classPrivateFieldGet(this, _FanViewHandler_instances, "m", _FanViewHandler_browseSummary).call(this);
        }
    }
}
exports.default = FanViewHandler;
_FanViewHandler_instances = new WeakSet(), _FanViewHandler_browseList = async function _FanViewHandler_browseList() {
    const view = this.currentView;
    const modelParams = {
        username: view.username,
        limit: BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    let fanItems;
    const model = this.getModel(model_1.ModelType.Fan);
    switch (view.view) {
        case 'collection':
            fanItems = await model.getCollection(modelParams);
            break;
        case 'wishlist':
            fanItems = await model.getWishlist(modelParams);
            break;
        case 'followingArtistsAndLabels':
            fanItems = await model.getFollowingArtistsAndLabels(modelParams);
            break;
        case 'followingGenres':
            fanItems = await model.getFollowingGenres(modelParams);
            break;
        default:
            throw Error(`Unknown view type: ${view.view}`);
    }
    const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
    const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
    const bandRenderer = this.getRenderer(renderers_1.RendererType.Band);
    const tagRenderer = this.getRenderer(renderers_1.RendererType.Tag);
    const listItems = [];
    fanItems.items.forEach((item) => {
        let rendered;
        switch (item.type) {
            case 'album':
                rendered = albumRenderer.renderToListItem(item);
                break;
            case 'artistOrLabel':
                rendered = bandRenderer.renderToListItem(item);
                break;
            case 'tag':
                rendered = tagRenderer.renderGenreListItem(item);
                break;
            case 'track':
                rendered = trackRenderer.renderToListItem(item, true, true);
                break;
            default:
                rendered = null;
        }
        if (rendered) {
            listItems.push(rendered);
        }
    });
    const nextPageRef = this.constructPageRef(fanItems.nextPageToken, fanItems.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    const fanItemsList = {
        availableListViews: ['list', 'grid'],
        items: listItems
    };
    const fanInfo = await model.getInfo(view.username);
    const fanItemsListTitle = __classPrivateFieldGet(this, _FanViewHandler_instances, "m", _FanViewHandler_getTitle).call(this, fanInfo);
    if (fanItemsListTitle) {
        fanItemsList.title = fanItemsListTitle;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists: [fanItemsList]
        }
    };
}, _FanViewHandler_browseSummary = async function _FanViewHandler_browseSummary() {
    const username = this.currentView.username;
    const baseUri = this.uri;
    const baseImgPath = 'music_service/mpd/';
    const fanInfo = await this.getModel(model_1.ModelType.Fan).getInfo(username);
    const fanView = {
        name: 'fan',
        username
    };
    const summaryItems = [
        {
            'service': 'bandcamp',
            'type': 'item-no-menu',
            'title': BandcampContext_1.default.getI18n('BANDCAMP_COLLECTION', fanInfo.collectionItemCount),
            'albumart': `/albumart?sourceicon=${baseImgPath}musiclibraryicon.png`,
            'uri': `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ ...fanView, view: 'collection' })}`
        },
        {
            'service': 'bandcamp',
            'type': 'item-no-menu',
            'title': BandcampContext_1.default.getI18n('BANDCAMP_WISHLIST', fanInfo.wishlistItemCount),
            'albumart': `/albumart?sourceicon=${baseImgPath}favouritesicon.png`,
            'uri': `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ ...fanView, view: 'wishlist' })}`
        },
        {
            'service': 'bandcamp',
            'type': 'item-no-menu',
            'title': BandcampContext_1.default.getI18n('BANDCAMP_FOLLOWING_ARTISTS_AND_LABELS', fanInfo.followingArtistsAndLabelsCount),
            'albumart': `/albumart?sourceicon=${baseImgPath}artisticon.png`,
            'uri': `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ ...fanView, view: 'followingArtistsAndLabels' })}`
        },
        {
            'service': 'bandcamp',
            'type': 'item-no-menu',
            'title': BandcampContext_1.default.getI18n('BANDCAMP_FOLLOWING_GENRES', fanInfo.followingGenresCount),
            'albumart': `/albumart?sourceicon=${baseImgPath}genreicon.png`,
            'uri': `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ ...fanView, view: 'followingGenres' })}`
        }
    ];
    const summaryItemsList = {
        availableListViews: ['list', 'grid'],
        items: summaryItems
    };
    const listTitle = __classPrivateFieldGet(this, _FanViewHandler_instances, "m", _FanViewHandler_getTitle).call(this, fanInfo);
    if (listTitle) {
        summaryItemsList.title = listTitle;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists: [summaryItemsList]
        }
    };
}, _FanViewHandler_getTitle = function _FanViewHandler_getTitle(fanInfo) {
    if (!fanInfo.url) {
        return null;
    }
    const viewProfileLink = {
        url: fanInfo.url,
        text: BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_MY_PROFILE'),
        icon: { type: 'fa', class: 'fa fa-user' },
        target: '_blank'
    };
    let titleKey;
    switch (this.currentView.view) {
        case 'collection':
            titleKey = 'BANDCAMP_MY_COLLECTION';
            break;
        case 'wishlist':
            titleKey = 'BANDCAMP_MY_WISHLIST';
            break;
        case 'followingArtistsAndLabels':
            titleKey = 'BANDCAMP_MY_FOLLOWING_ARTISTS_AND_LABELS';
            break;
        case 'followingGenres':
            titleKey = 'BANDCAMP_MY_FOLLOWING_GENRES';
            break;
        default:
            titleKey = 'BANDCAMP_MY_BANDCAMP';
    }
    const mainTitle = BandcampContext_1.default.getI18n(titleKey);
    const secondaryTitle = fanInfo.location ?
        BandcampContext_1.default.getI18n('BANDCAMP_MY_BANDCAMP_NAME_LOCATION', fanInfo.name, fanInfo.location) :
        fanInfo.name;
    return UIHelper_1.default.constructDoubleLineTitleWithImageAndLink({
        imgSrc: fanInfo.imageUrl,
        title: mainTitle,
        secondaryTitle,
        link: viewProfileLink
    });
};
//# sourceMappingURL=FanViewHandler.js.map