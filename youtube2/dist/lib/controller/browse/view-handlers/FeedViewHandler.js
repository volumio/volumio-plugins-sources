"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FeedViewHandler_instances, _FeedViewHandler_sectionToLists, _FeedViewHandler_renderToListItem, _FeedViewHandler_hasNoThumbnails, _FeedViewHandler_getContinuationPrevItemCount, _FeedViewHandler_createContinuationBundleOption, _FeedViewHandler_createOptionFromTabs;
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const Endpoint_1 = require("../../../types/Endpoint");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
const EndpointHelper_1 = __importDefault(require("../../../util/EndpointHelper"));
class FeedViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _FeedViewHandler_instances.add(this);
    }
    async browse() {
        const contents = await this.getContents();
        if (!contents) {
            throw Error('No contents');
        }
        this.applyContinuationBundle(contents);
        const header = this.getHeader(contents.header);
        const lists = [];
        contents?.sections?.forEach((section) => {
            lists.push(...__classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_sectionToLists).call(this, contents, section, header));
        });
        if (lists.length === 0) {
            lists.push({
                availableListViews: ['list'],
                items: []
            });
        }
        if (!lists[0].title && !header && contents.header?.title) {
            lists[0].title = contents.header.title;
        }
        const nav = {
            info: header,
            prev: {
                uri: this.constructPrevUri()
            },
            lists
        };
        if (contents.tabs) {
            const tabsToListItem = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_renderToListItem).call(this, __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_createOptionFromTabs).call(this, contents.tabs));
            if (tabsToListItem) {
                lists.unshift({
                    availableListViews: ['list'],
                    items: [tabsToListItem]
                });
            }
        }
        return { navigation: nav };
    }
    getHeader(data) {
        if (!data) {
            return null;
        }
        switch (data.type) {
            case 'channel':
                return this.getRenderer(renderers_1.RendererType.Channel).renderToHeader(data);
            case 'playlist':
                return this.getRenderer(renderers_1.RendererType.Playlist).renderToHeader(data);
            default:
                return null;
        }
    }
    // Creates a bundle that passes to the next continuation of the specified section.
    // The bundle gets appended to the continuation uri and shall ultimately be passed
    // Back to this handler, which will then apply the bundle to the continuation contents
    // Before creating the view.
    createContinuationBundle(contents, section) {
        const bundle = {
            section: {
                title: section.title || null,
                filters: section.filters || null,
                menus: section.menus || null,
                buttons: section.buttons || null
            },
            contents: {
                header: contents.header || null,
                tabs: contents.tabs || null
            }
        };
        return bundle;
    }
    applyContinuationBundle(contents) {
        if (!contents.isContinuation) {
            return false;
        }
        const view = this.currentView;
        const bundle = view.continuationBundle || null;
        if (!bundle || !contents) {
            return false;
        }
        if (bundle.contents?.header && !contents.header) {
            contents.header = bundle.contents.header;
        }
        if (bundle.contents?.tabs && !contents.tabs) {
            contents.tabs = bundle.contents.tabs;
        }
        if (bundle && contents?.sections) {
            const continuationSection = contents.sections[0];
            if (continuationSection) {
                const firstItemIsSection = continuationSection.items?.[0]?.type === 'section';
                if (bundle.section?.title && !firstItemIsSection && !continuationSection.title) {
                    continuationSection.title = bundle.section.title;
                }
                if (bundle.section?.filters) {
                    continuationSection.filters = bundle.section.filters;
                }
                if (bundle.section?.menus) {
                    continuationSection.menus = bundle.section.menus;
                }
                if (bundle.section?.buttons) {
                    continuationSection.buttons = bundle.section.buttons;
                }
            }
        }
        return true;
    }
    getAvailableListViews(items) {
        // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
        // If there are other switchable lists and the user clicks the switch view button.
        if (items.length === 0 || __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_hasNoThumbnails).call(this, items)) {
            return ['list'];
        }
        else if (items?.every((item) => item.type === 'channel')) {
            return ['grid'];
        }
        return ['list', 'grid'];
    }
    findAllItemsInSection(target, predicate) {
        if (!target) {
            return [];
        }
        if (Array.isArray(target)) {
            return target.reduce((result, section) => {
                result.push(...this.findAllItemsInSection(section, predicate));
                return result;
            }, []);
        }
        const result = [];
        target.items?.forEach((item) => {
            if (item.type === 'section') {
                result.push(...this.findAllItemsInSection(item, predicate));
            }
            else if (typeof predicate !== 'function' || predicate(item)) {
                result.push(item);
            }
        });
        return result;
    }
    findAllEndpointsInSection(target, predicate) {
        if (!target) {
            return [];
        }
        const __applyPredicate = (endpoint) => {
            if (typeof predicate !== 'function') {
                return true;
            }
            return predicate(endpoint);
        };
        if (Array.isArray(target)) {
            return target.reduce((result, section) => {
                result.push(...this.findAllEndpointsInSection(section, predicate));
                return result;
            }, []);
        }
        const result = [];
        const haystack = [
            ...target.buttons || [],
            ...target.items
        ];
        for (const needle of haystack) {
            if (needle.type === 'section') {
                result.push(...this.findAllEndpointsInSection(needle, predicate));
            }
            else if (needle.endpoint && __applyPredicate(needle.endpoint)) {
                result.push(needle.endpoint);
            }
        }
        return result;
    }
}
exports.default = FeedViewHandler;
_FeedViewHandler_instances = new WeakSet(), _FeedViewHandler_sectionToLists = function _FeedViewHandler_sectionToLists(contents, section, header) {
    const listsForSection = [];
    const isPlaylistContents = contents.header?.type === 'playlist';
    const continuationBundle = this.createContinuationBundle(contents, section);
    let hasNestedSections = false; // Talking about nested sections with actual contents
    // List: section main items
    const mainItems = [];
    // Disregard nested section when determining if every item is video, because
    // The nested section will be converted to separate list(s).
    const isAllVideos = section.items.every((item) => item.type === 'section' || item.type === 'video');
    section.items?.forEach((item) => {
        if (item.type === 'section') {
            const nestedSectionToLists = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_sectionToLists).call(this, contents, item, header);
            if (nestedSectionToLists.length > 0) {
                listsForSection.push(...__classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_sectionToLists).call(this, contents, item, header));
                hasNestedSections = true;
            }
        }
        else {
            const ytPlaybackMode = YouTube2Context_1.default.getConfigValue('ytPlaybackMode');
            const listItem = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_renderToListItem).call(this, item);
            if (listItem) {
                if (item.type === 'video' && (!isAllVideos ||
                    (isPlaylistContents ? ytPlaybackMode.playlistVideos : ytPlaybackMode.feedVideos))) {
                    // Setting type to 'album' ensures only this item will get exploded when clicked. The exception
                    // Is when listing videos in a playlist.
                    listItem.type = 'album';
                }
                mainItems.push(listItem);
            }
        }
    });
    if (mainItems.length > 0) {
        listsForSection.unshift({
            availableListViews: this.getAvailableListViews(section.items.filter((item) => item.type !== 'section')),
            items: mainItems
        });
    }
    // Section title
    const prevItemCount = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_getContinuationPrevItemCount).call(this);
    const currentItemCount = prevItemCount + mainItems.length;
    const showingResultsText = mainItems.length > 0 && (section.continuation || (contents.type === 'page' && contents.isContinuation)) && isPlaylistContents ?
        YouTube2Context_1.default.getI18n('YOUTUBE2_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
    let sectionTitle = section.title;
    if (showingResultsText) {
        if (section.title) {
            sectionTitle = `${section.title} (${showingResultsText.charAt(0).toLocaleLowerCase()}${showingResultsText.substring(1)})`;
        }
        else {
            sectionTitle = showingResultsText;
        }
    }
    if (section.continuation) {
        const continuationItem = this.constructContinuationItem({ continuation: section.continuation, prevItemCount: currentItemCount, bundle: continuationBundle });
        if (!hasNestedSections) {
            mainItems.push(continuationItem);
        }
        else {
            listsForSection.push({
                availableListViews: ['list'],
                items: [continuationItem]
            });
        }
    }
    const dataStartItems = [];
    const dataEndItems = [];
    // List: section start items
    // -- Filters
    if (continuationBundle.section?.filters) {
        // Check if selected filter has an endpoint and if none, set it to current.
        // (Targeting 'All' in Home, but maybe there are others as well)
        const view = this.currentView;
        const currentViewEndpoint = view.endpoint || null;
        if (!EndpointHelper_1.default.isType(currentViewEndpoint, Endpoint_1.EndpointType.Watch)) {
            continuationBundle.section.filters.forEach((filter) => {
                const selected = filter.optionValues.find((ov) => ov.selected);
                if (selected && !selected.endpoint) {
                    selected.endpoint = currentViewEndpoint;
                }
            });
        }
        continuationBundle.section.filters.forEach((filter, index) => {
            dataStartItems.push(__classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_createContinuationBundleOption).call(this, continuationBundle, `section.filters.${index}`));
        });
    }
    // -- Menus
    if (continuationBundle.section?.menus) {
        continuationBundle.section.menus.forEach((menu, index) => {
            dataStartItems.push(__classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_createContinuationBundleOption).call(this, continuationBundle, `section.menus.${index}`));
        });
    }
    // -- Buttons
    if (continuationBundle.section?.buttons) {
        const targetItems = dataStartItems.length === 0 ? dataStartItems : dataEndItems;
        continuationBundle.section.buttons.forEach((button) => {
            const buttonEndpointItem = {
                type: 'endpointLink',
                title: button.text,
                endpoint: button.endpoint
            };
            targetItems.push(buttonEndpointItem);
        });
    }
    const startItems = dataStartItems.reduce((rendered, data) => {
        const listItem = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_renderToListItem).call(this, data);
        if (listItem) {
            rendered.push(listItem);
        }
        return rendered;
    }, []);
    const endItems = dataEndItems.reduce((rendered, data) => {
        const listItem = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_renderToListItem).call(this, data);
        if (listItem) {
            rendered.push(listItem);
        }
        return rendered;
    }, []);
    if (startItems.length > 0) {
        listsForSection.unshift({
            availableListViews: ['list'],
            items: [...startItems]
        });
    }
    if (endItems.length > 0) {
        listsForSection.push({
            availableListViews: ['list'],
            items: [...endItems]
        });
    }
    // Set section title
    if (listsForSection.length > 0 && !listsForSection[0].title) {
        listsForSection[0].title = sectionTitle;
    }
    if (mainItems.length === 0 && !hasNestedSections && (sectionTitle || startItems.length > 0 || endItems.length > 0)) {
        listsForSection.push({
            title: sectionTitle,
            availableListViews: ['list'],
            items: []
        });
    }
    return listsForSection;
}, _FeedViewHandler_renderToListItem = function _FeedViewHandler_renderToListItem(data) {
    switch (data.type) {
        case 'channel':
            return this.getRenderer(renderers_1.RendererType.Channel).renderToListItem(data);
        case 'endpointLink':
        case 'guideEntry':
            return this.getRenderer(renderers_1.RendererType.EndpointLink).renderToListItem(data);
        case 'playlist':
            return this.getRenderer(renderers_1.RendererType.Playlist).renderToListItem(data);
        case 'video':
            return this.getRenderer(renderers_1.RendererType.Video).renderToListItem(data);
        case 'option':
        case 'continuationBundleOption':
            return this.getRenderer(renderers_1.RendererType.Option).renderToListItem(data);
        default:
            return null;
    }
}, _FeedViewHandler_hasNoThumbnails = function _FeedViewHandler_hasNoThumbnails(items) {
    return !items.find((item) => item.type === 'continuationBundleOption' || item.type === 'option' || item.thumbnail);
}, _FeedViewHandler_getContinuationPrevItemCount = function _FeedViewHandler_getContinuationPrevItemCount() {
    const continuation = this.currentView.continuation;
    if (continuation) {
        return continuation.prevItemCount || 0;
    }
    return 0;
}, _FeedViewHandler_createContinuationBundleOption = function _FeedViewHandler_createContinuationBundleOption(bundle, targetKey) {
    return {
        type: 'continuationBundleOption',
        continuationBundle: bundle,
        targetKey
    };
}, _FeedViewHandler_createOptionFromTabs = function _FeedViewHandler_createOptionFromTabs(tabs) {
    return {
        type: 'option',
        optionValues: tabs
    };
};
//# sourceMappingURL=FeedViewHandler.js.map