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
var _DiscoverViewHandler_instances, _DiscoverViewHandler_browseDiscoverResult, _DiscoverViewHandler_getDiscoverParamsFromUriOrDefault, _DiscoverViewHandler_getParamsListFromDiscoverResult, _DiscoverViewHandler_getBrowseByTagsLink, _DiscoverViewHandler_getBrowseByTagsLinkData, _DiscoverViewHandler_getAlbumsListFromDiscoverResult, _DiscoverViewHandler_browseDiscoverOptions, _DiscoverViewHandler_constructDiscoverOptionUri, _DiscoverViewHandler_constructUriWithParams;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const model_1 = require("../../../model");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const DISCOVER_OPTION_ICONS = {
    genre: 'fa fa-music',
    subgenre: 'fa fa-filter',
    sortBy: 'fa fa-sort',
    artistRecommendationType: 'fa fa-thumbs-o-up',
    location: 'fa fa-map-marker',
    format: 'fa fa-archive',
    time: 'fa fa-clock-o'
};
class DiscoverViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _DiscoverViewHandler_instances.add(this);
    }
    browse() {
        if (this.currentView.select) {
            return __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_browseDiscoverOptions).call(this);
        }
        return __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_browseDiscoverResult).call(this);
    }
}
exports.default = DiscoverViewHandler;
_DiscoverViewHandler_instances = new WeakSet(), _DiscoverViewHandler_browseDiscoverResult = async function _DiscoverViewHandler_browseDiscoverResult() {
    const view = this.currentView;
    const modelParams = {
        discoverParams: __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getDiscoverParamsFromUriOrDefault).call(this),
        limit: view.inSection ? BandcampContext_1.default.getConfigValue('itemsPerSectionDiscover', 11) : BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
    };
    if (view.pageRef) {
        modelParams.pageToken = view.pageRef.pageToken;
        modelParams.pageOffset = view.pageRef.pageOffset;
    }
    const model = this.getModel(model_1.ModelType.Discover);
    const discoverResults = await model.getDiscoverResult(modelParams);
    const discoverOptions = await model.getDiscoverOptions();
    const lists = [
        __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getParamsListFromDiscoverResult).call(this, discoverResults.params, discoverOptions),
        __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getAlbumsListFromDiscoverResult).call(this, discoverResults)
    ];
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _DiscoverViewHandler_getDiscoverParamsFromUriOrDefault = function _DiscoverViewHandler_getDiscoverParamsFromUriOrDefault() {
    const view = this.currentView;
    const params = {};
    if (view.genre) {
        params.genre = view.genre;
        if (view.subgenre) {
            params.subgenre = view.subgenre;
        }
    }
    if (view.sortBy) {
        params.sortBy = view.sortBy;
        if (view.artistRecommendationType) {
            params.artistRecommendationType = view.artistRecommendationType;
        }
    }
    if (view.location) {
        params.location = view.location;
    }
    if (view.format) {
        params.format = view.format;
    }
    if (view.time) {
        params.time = parseInt(view.time, 10);
    }
    if (Object.keys(params).length) {
        return params;
    }
    const defaultParams = BandcampContext_1.default.getConfigValue('defaultDiscoverParams', null, true);
    return defaultParams || {};
}, _DiscoverViewHandler_getParamsListFromDiscoverResult = function _DiscoverViewHandler_getParamsListFromDiscoverResult(params, discoverOptions) {
    const baseUri = __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_constructUriWithParams).call(this, params);
    const listItems = [];
    ['genre', 'subgenre', 'sortBy', 'artistRecommendationType', 'location', 'format', 'time'].forEach((o) => {
        const paramValue = params[o];
        if (paramValue !== undefined) {
            let optArr = discoverOptions[`${o}s`] || [];
            if (o === 'subgenre') {
                optArr = params.genre ? optArr[params.genre] || [] : [];
            }
            if (optArr.length) {
                const opts = optArr;
                const opt = opts.find((o) => o.value == paramValue);
                const title = opt ? opt.name : opts[0].name;
                listItems.push({
                    service: 'bandcamp',
                    type: 'item-no-menu',
                    title,
                    icon: DISCOVER_OPTION_ICONS[o],
                    uri: `${baseUri}@select=${o}`
                });
            }
        }
    });
    const setDefaultJS = `
                const params = ${JSON.stringify(params)};
                const payload = {
                    'endpoint': 'music_service/bandcamp',
                    'method': 'saveDefaultDiscoverParams',
                    'data': params
                };
                angular.element('#browse-page').scope().browse.socketService.emit('callMethod', payload);`;
    const setDefaultLink = {
        url: '#',
        icon: { type: 'fa', class: 'fa fa-cog' },
        text: BandcampContext_1.default.getI18n('BANDCAMP_SET_DEFAULT_DISCOVER_PARAMS'),
        onclick: setDefaultJS.replace(/"/g, '&quot;').replace(/\r?\n|\r/g, '')
    };
    const links = [
        setDefaultLink,
        __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getBrowseByTagsLink).call(this)
    ];
    const title = UIHelper_1.default.constructListTitleWithLink(UIHelper_1.default.addBandcampIconToListTitle(BandcampContext_1.default.getI18n(this.currentView.inSection ? 'BANDCAMP_DISCOVER_SHORT' : 'BANDCAMP_DISCOVER')), links, true);
    if (!UIHelper_1.default.supportsEnhancedTitles()) {
        // Compensate for loss of 'browse by tags' link
        const browseByTagsLinkData = __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getBrowseByTagsLinkData).call(this);
        listItems.push({
            service: 'bandcamp',
            type: 'item-no-menu',
            uri: browseByTagsLinkData.uri,
            title: browseByTagsLinkData.text,
            icon: 'fa fa-arrow-circle-right'
        });
    }
    return {
        title,
        availableListViews: ['list'],
        items: listItems
    };
}, _DiscoverViewHandler_getBrowseByTagsLink = function _DiscoverViewHandler_getBrowseByTagsLink() {
    const linkData = __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_getBrowseByTagsLinkData).call(this);
    return {
        url: '#',
        text: linkData.text,
        onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${linkData.uri}'})`,
        icon: {
            type: 'fa',
            class: 'fa fa-arrow-circle-right',
            float: 'right',
            color: '#54c688'
        }
    };
}, _DiscoverViewHandler_getBrowseByTagsLinkData = function _DiscoverViewHandler_getBrowseByTagsLinkData() {
    return {
        uri: `${this.uri}/tag`,
        text: BandcampContext_1.default.getI18n('BANDCAMP_BROWSE_BY_TAGS')
    };
}, _DiscoverViewHandler_getAlbumsListFromDiscoverResult = function _DiscoverViewHandler_getAlbumsListFromDiscoverResult(discoverResult) {
    const albumRenderer = this.getRenderer(renderers_1.RendererType.Album);
    const listItems = discoverResult.items.reduce((result, album) => {
        const rendered = albumRenderer.renderToListItem(album);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(discoverResult.nextPageToken, discoverResult.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        listItems.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _DiscoverViewHandler_browseDiscoverOptions = async function _DiscoverViewHandler_browseDiscoverOptions() {
    const view = this.currentView;
    const targetOption = view.select;
    if (!targetOption) {
        throw Error('Target option missing');
    }
    const discoverOptions = await this.getModel(model_1.ModelType.Discover).getDiscoverOptions();
    let optArr = discoverOptions[`${view.select}s`] || [];
    if (view.select === 'subgenre' && optArr) {
        optArr = view.genre ? optArr[view.genre] || [] : [];
    }
    const listItems = optArr.map((opt) => {
        const isSelected = opt.value == view[view.select];
        let title = opt.name;
        if (isSelected) {
            title = UIHelper_1.default.styleText(title, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED);
        }
        return {
            service: 'bandcamp',
            type: 'item-no-menu',
            title,
            icon: isSelected ? 'fa fa-check' : 'fa',
            uri: __classPrivateFieldGet(this, _DiscoverViewHandler_instances, "m", _DiscoverViewHandler_constructDiscoverOptionUri).call(this, targetOption, opt.value)
        };
    });
    let title = BandcampContext_1.default.getI18n(`BANDCAMP_SELECT_${targetOption.toUpperCase()}`);
    title = UIHelper_1.default.addIconToListTitle(DISCOVER_OPTION_ICONS[targetOption], title);
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
}, _DiscoverViewHandler_constructDiscoverOptionUri = function _DiscoverViewHandler_constructDiscoverOptionUri(option, value) {
    const targetView = {
        ...this.currentView
    };
    if (this.currentView[option] !== value) {
        delete targetView.pageRef;
        delete targetView.prevPageRefs;
        targetView[option] = value;
    }
    delete targetView.select;
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
}, _DiscoverViewHandler_constructUriWithParams = function _DiscoverViewHandler_constructUriWithParams(params) {
    const targetView = {
        ...this.currentView,
        ...params
    };
    return ViewHelper_1.default.constructUriFromViews([
        ...this.previousViews,
        targetView
    ]);
};
//# sourceMappingURL=DiscoverViewHandler.js.map