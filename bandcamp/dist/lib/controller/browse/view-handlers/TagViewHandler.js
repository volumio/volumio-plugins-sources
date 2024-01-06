"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TagViewHandler_instances, _TagViewHandler_browseTags, _TagViewHandler_getTagsList, _TagViewHandler_browseReleases, _TagViewHandler_getSelectTagList, _TagViewHandler_getFilterOptionsList, _TagViewHandler_getReleasesList, _TagViewHandler_browseFilterOptions, _TagViewHandler_constructTagUrl, _TagViewHandler_constructFilterOptionUrl, _TagViewHandler_constructUriWithParams, _TagViewHandler_getReleasesFiltersFromUriAndDefault;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const FILTER_ICONS = {
    sort: 'fa fa-sort',
    location: 'fa fa-map-marker',
    format: 'fa fa-archive'
};
const FILTER_NAMES = ['format', 'location', 'sort'];
class TagViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _TagViewHandler_instances.add(this);
    }
    async browse() {
        const view = this.currentView;
        if (view.select) {
            return view.select === 'tag' ? __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseTags).call(this) : __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseFilterOptions).call(this);
        }
        else if (view.tagUrl) {
            return __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseReleases).call(this);
        }
        return __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseTags).call(this);
    }
    async getTracksOnExplode() {
        const view = this.currentView;
        const tagUrl = view.tagUrl;
        if (!tagUrl) {
            throw Error('Tag URL missing');
        }
        const modelParams = {
            tagUrl,
            limit: BandcampContext_1.default.getConfigValue('itemsPerPage', 47),
            filters: await __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getReleasesFiltersFromUriAndDefault).call(this)
        };
        if (view.pageRef) {
            modelParams.pageToken = view.pageRef.pageToken;
            modelParams.pageOffset = view.pageRef.pageOffset;
        }
        const releases = await this.getModel(model_1.ModelType.Tag).getReleases(modelParams);
        const tracks = releases.items.reduce((result, release) => {
            if (release.type === 'album' && release.featuredTrack?.streamUrl) {
                const track = {
                    type: 'track',
                    name: release.featuredTrack.name,
                    thumbnail: release.thumbnail,
                    artist: release.artist,
                    album: {
                        type: 'album',
                        name: release.name,
                        url: release.url
                    },
                    position: release.featuredTrack.position,
                    streamUrl: release.featuredTrack.streamUrl
                };
                result.push(track);
            }
            else if (release.type === 'track') {
                const track = {
                    type: 'track',
                    name: release.name,
                    url: release.url,
                    thumbnail: release.thumbnail,
                    artist: release.artist,
                    streamUrl: release.streamUrl
                };
                result.push(track);
            }
            return result;
        }, []);
        return tracks;
    }
    /**
     * Override
     *
     * Track uri - one of:
     * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}
     * - bandcamp/track@trackUrl={...}@artistUrl={...}@albumurl={...}
     */
    getTrackUri(track) {
        const artistUrl = track.artist?.url || null;
        const albumUrl = track.album?.url || artistUrl;
        const trackUrl = track.url || null;
        if (track.album && albumUrl) {
            const albumView = {
                name: 'album',
                albumUrl
            };
            if (track.position) {
                albumView.track = track.position.toString();
            }
            if (artistUrl) {
                albumView.artistUrl = artistUrl;
            }
            return `bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
        }
        if (trackUrl) {
            const trackView = {
                name: 'track',
                trackUrl
            };
            if (artistUrl) {
                trackView.artistUrl = artistUrl;
            }
            if (albumUrl) {
                trackView.albumUrl = albumUrl;
            }
            return `bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`;
        }
        return null;
    }
}
exports.default = TagViewHandler;
_TagViewHandler_instances = new WeakSet(), _TagViewHandler_browseTags = async function _TagViewHandler_browseTags() {
    const view = this.currentView;
    const tagUrl = view.tagUrl || null;
    const tags = await this.getModel(model_1.ModelType.Tag).getTags();
    const lists = [
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getTagsList).call(this, tags, 'tags', BandcampContext_1.default.getI18n('BANDCAMP_TAGS'), 'fa fa-tag', tagUrl),
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getTagsList).call(this, tags, 'locations', BandcampContext_1.default.getI18n('BANDCAMP_LOCATIONS'), 'fa fa-map-marker', tagUrl)
    ];
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _TagViewHandler_getTagsList = function _TagViewHandler_getTagsList(tags, key, title, icon, currentTagUrl) {
    const tagRenderer = this.getRenderer(renderers_1.RendererType.Tag);
    const listItems = tags[key].reduce((result, tag) => {
        const rendered = tagRenderer.renderToListItem(tag, {
            selected: tag.url === currentTagUrl,
            uri: __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_constructTagUrl).call(this, tag.url)
        });
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    return {
        title: UIHelper_1.default.addIconToListTitle(icon, title),
        availableListViews: ['list'],
        items: listItems
    };
}, _TagViewHandler_browseReleases = async function _TagViewHandler_browseReleases() {
    const view = this.currentView;
    const model = this.getModel(model_1.ModelType.Tag);
    const tagUrl = view.tagUrl;
    const modelParams = {
        tagUrl,
        limit: BandcampContext_1.default.getConfigValue('itemsPerPage', 47),
        filters: await __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getReleasesFiltersFromUriAndDefault).call(this)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    const filterOptions = await model.getReleasesAvailableFilters(tagUrl);
    const releases = await model.getReleases(modelParams);
    const baseUri = __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_constructUriWithParams).call(this, releases.filters);
    const allLists = [
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getSelectTagList).call(this, baseUri),
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getFilterOptionsList).call(this, releases.filters, filterOptions, baseUri),
        __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getReleasesList).call(this, releases)
    ];
    const tagInfo = await model.getTag(tagUrl);
    const tagRenderer = this.getRenderer(renderers_1.RendererType.Tag);
    const header = tagRenderer.renderToHeader(tagInfo);
    if (header && allLists[2].items.length > 0) {
        header.albumart = allLists[2].items[0].albumart;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: header,
            lists: allLists
        }
    };
}, _TagViewHandler_getSelectTagList = function _TagViewHandler_getSelectTagList(baseUri) {
    return {
        availableListViews: ['list'],
        items: [{
                service: 'bandcamp',
                type: 'item-no-menu',
                title: BandcampContext_1.default.getI18n('BANDCAMP_SELECT_TAG'),
                icon: 'fa fa-tag',
                uri: `${baseUri}@select=tag`
            }]
    };
}, _TagViewHandler_getFilterOptionsList = function _TagViewHandler_getFilterOptionsList(current, all, baseUri) {
    const listItems = [];
    FILTER_NAMES.forEach((o) => {
        const filterValue = current[o];
        if (filterValue != undefined) {
            const filter = all.find((f) => f.name === o) || null;
            if (filter) {
                const opt = filter.options.find((o) => o.value == filterValue);
                const title = opt ? opt.name : filterValue;
                listItems.push({
                    service: 'bandcamp',
                    type: 'item-no-menu',
                    title,
                    icon: FILTER_ICONS[o],
                    uri: `${baseUri}@select=${o}`
                });
            }
        }
    });
    return {
        title: BandcampContext_1.default.getI18n('BANDCAMP_RELEASES'),
        availableListViews: ['list'],
        items: listItems
    };
}, _TagViewHandler_getReleasesList = function _TagViewHandler_getReleasesList(releases) {
    const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
    const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
    const listItems = releases.items.reduce((result, item) => {
        let rendered;
        if (item.type === 'album') {
            rendered = albumRenderer.renderToListItem(item);
        }
        else if (item.type === 'track') {
            rendered = trackRenderer.renderToListItem(item, true, true);
        }
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(releases.nextPageToken, releases.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _TagViewHandler_browseFilterOptions = async function _TagViewHandler_browseFilterOptions() {
    const view = this.currentView;
    const filterName = view.select;
    if (!filterName) {
        throw Error('Target filter not specified');
    }
    const tagUrl = view.tagUrl;
    const filterOptions = await this.getModel(model_1.ModelType.Tag).getReleasesAvailableFilters(tagUrl);
    const filter = filterOptions.find((f) => f.name === filterName) || null;
    let listItems;
    if (filter && view.select) {
        listItems = filter.options.reduce((result, opt) => {
            const isSelected = opt.value.toString() === view[filterName];
            let title = opt.name;
            if (isSelected) {
                title = UIHelper_1.default.styleText(title, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED);
            }
            result.push({
                service: 'bandcamp',
                type: 'item-no-menu',
                title,
                icon: isSelected ? 'fa fa-check' : 'fa',
                uri: __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_constructFilterOptionUrl).call(this, filterName, opt.value)
            });
            return result;
        }, []);
    }
    else {
        listItems = [];
    }
    let title = BandcampContext_1.default.getI18n(`BANDCAMP_SELECT_${filterName.toUpperCase()}`);
    title = UIHelper_1.default.addIconToListTitle(FILTER_ICONS[filterName], title);
    const lists = [{
            title,
            availableListViews: ['list'],
            items: listItems
        }];
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _TagViewHandler_constructTagUrl = function _TagViewHandler_constructTagUrl(tagUrl) {
    const targetView = {
        ...this.currentView
    };
    if (this.currentView.tagUrl !== tagUrl) {
        delete targetView.pageRef;
        delete targetView.prevPageRefs;
        targetView.tagUrl = tagUrl;
    }
    delete targetView.select;
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
}, _TagViewHandler_constructFilterOptionUrl = function _TagViewHandler_constructFilterOptionUrl(optionName, optionValue) {
    const targetView = {
        ...this.currentView
    };
    if (this.currentView[optionName] !== optionValue.toString()) {
        delete targetView.pageRef;
        delete targetView.prevPageRefs;
        targetView[optionName] = optionValue;
    }
    delete targetView.select;
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
}, _TagViewHandler_constructUriWithParams = function _TagViewHandler_constructUriWithParams(params) {
    const targetView = {
        ...this.currentView,
        ...params
    };
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
}, _TagViewHandler_getReleasesFiltersFromUriAndDefault = async function _TagViewHandler_getReleasesFiltersFromUriAndDefault() {
    const view = this.currentView;
    const tagUrl = view.tagUrl;
    const model = this.getModel(model_1.ModelType.Tag);
    const filterOptions = await model.getReleasesAvailableFilters(tagUrl);
    const allowedFilterOptions = filterOptions.filter((filter) => FILTER_NAMES.includes(filter.name));
    const defaultFilters = allowedFilterOptions.reduce((result, f) => {
        const selected = f.options.find((o) => o.selected);
        if (selected) {
            result[f.name] = selected.value;
        }
        return result;
    }, {});
    const filtersFromView = Object.keys(view).reduce((result, key) => {
        if (FILTER_NAMES.includes(key)) {
            result[key] = view[key];
        }
        return result;
    }, {});
    return {
        ...defaultFilters,
        ...filtersFromView
    };
};
//# sourceMappingURL=TagViewHandler.js.map