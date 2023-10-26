"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LibraryViewHandler_instances, _LibraryViewHandler_renderToListItem, _LibraryViewHandler_getTitle, _LibraryViewHandler_browseFilters, _LibraryViewHandler_getFilterOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class LibraryViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _LibraryViewHandler_instances.add(this);
    }
    async browse() {
        const { type, pageRef, filter = 'all', selectFilter = false } = this.currentView;
        if (selectFilter && (type === 'album' || type === 'playlist')) {
            return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_browseFilters).call(this);
        }
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
        const modelParams = {
            type,
            limit: SoundCloudContext_1.default.getConfigValue('itemsPerPage'),
            filter
        };
        if (pageToken) {
            modelParams.pageToken = pageRef.pageToken;
        }
        if (pageOffset) {
            modelParams.pageOffset = pageRef.pageOffset;
        }
        const items = await this.getModel(model_1.ModelType.Me).getLibraryItems(modelParams);
        const page = this.buildPageFromLoopFetchResult(items, {
            render: __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_renderToListItem).bind(this)
        });
        // Filter
        const filterOptions = __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFilterOptions).call(this);
        const browseFilterView = {
            ...this.currentView,
            selectFilter: '1'
        };
        const browseFilterUri = ViewHelper_1.default.constructUriFromViews([
            ...this.previousViews,
            browseFilterView
        ]);
        const filterListItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: filterOptions.find((option) => option.value === filter)?.label || SoundCloudContext_1.default.getI18n('SOUNDCLOUD_FILTER_ALL'),
            icon: 'fa fa-filter',
            uri: browseFilterUri
        };
        const filterList = {
            title: __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getTitle).call(this),
            items: [filterListItem],
            availableListViews: ['list']
        };
        if (page.navigation?.lists) {
            page.navigation.lists.unshift(filterList);
        }
        return page;
    }
}
exports.default = LibraryViewHandler;
_LibraryViewHandler_instances = new WeakSet(), _LibraryViewHandler_renderToListItem = function _LibraryViewHandler_renderToListItem(item) {
    if (item.type === 'album') {
        return this.getRenderer(renderers_1.RendererType.Album).renderToListItem(item, true);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
        return this.getRenderer(renderers_1.RendererType.Playlist).renderToListItem(item, true);
    }
    return null;
}, _LibraryViewHandler_getTitle = function _LibraryViewHandler_getTitle() {
    const { type } = this.currentView;
    if (type === 'album') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_ALBUMS');
    }
    else if (type === 'playlist') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_PLAYLISTS');
    }
    else if (type === 'station') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_STATIONS');
    }
    return undefined;
}, _LibraryViewHandler_browseFilters = async function _LibraryViewHandler_browseFilters() {
    const view = this.currentView;
    const { filter = 'all' } = view;
    const options = __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFilterOptions).call(this);
    const listItems = options.map((option) => {
        const isSelected = option.value === filter;
        let title;
        if (isSelected) {
            title = `<span style='color: #54c688; font-weight: bold;'}>${option.label}</span>`;
        }
        else {
            title = option.label;
        }
        const viewWithSelectedOption = {
            ...this.currentView
        };
        if (this.currentView.filter !== option.value) {
            delete viewWithSelectedOption.pageRef;
            delete viewWithSelectedOption.prevPageRefs;
            viewWithSelectedOption.filter = option.value;
        }
        delete viewWithSelectedOption.selectFilter;
        const uriWithSelectedOption = ViewHelper_1.default.constructUriFromViews([
            ...this.previousViews,
            viewWithSelectedOption
        ]);
        return {
            service: 'soundcloud',
            type: 'item-no-menu',
            title,
            icon: isSelected ? 'fa fa-check' : 'fa',
            uri: uriWithSelectedOption
        };
    });
    const list = {
        availableListViews: ['list'],
        items: listItems
    };
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists: [list]
        }
    };
}, _LibraryViewHandler_getFilterOptions = function _LibraryViewHandler_getFilterOptions() {
    const options = [
        {
            label: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_FILTER_ALL'),
            value: 'all'
        },
        {
            label: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_FILTER_CREATED'),
            value: 'created'
        },
        {
            label: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_FILTER_LIKED'),
            value: 'liked'
        }
    ];
    return options;
};
//# sourceMappingURL=LibraryViewHandler.js.map