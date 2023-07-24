"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FeedViewHandler_instances, _FeedViewHandler_sectionToLists, _FeedViewHandler_getContinuationPrevItemCount, _FeedViewHandler_createContinuationBundleOption, _FeedViewHandler_createOptionFromTabs;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const Endpoint_1 = require("../../../types/Endpoint");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
const AutoplayHelper_1 = __importDefault(require("../../../util/AutoplayHelper"));
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
            // Don't show single tab, but use its title where appropriate
            if (contents.tabs.length === 1) {
                const tabTitle = contents.tabs[0].text;
                if (tabTitle && lists[0] && !lists[0].title) {
                    lists[0].title = tabTitle;
                }
            }
            else {
                const tabsToListItem = this.renderToListItem(__classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_createOptionFromTabs).call(this, contents.tabs), contents);
                if (tabsToListItem) {
                    if (lists[0].isFiltersAndButtons) {
                        lists[0].items.unshift(tabsToListItem);
                    }
                    else {
                        lists.unshift({
                            availableListViews: ['list'],
                            items: [tabsToListItem]
                        });
                    }
                }
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
            case 'album':
                return this.getRenderer(renderers_1.RendererType.Album).renderToHeader(data);
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
                subtitle: section.subtitle || null,
                filters: section.filters || null,
                buttons: section.buttons || null,
                filtersFromParent: false,
                buttonsFromParent: false
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
        if (bundle && contents?.sections && !contents.isReload) {
            const continuationSection = contents.sections[0];
            if (continuationSection) {
                const firstItemIsSection = continuationSection.items?.[0]?.type === 'section';
                if (bundle.section?.title && !firstItemIsSection && !continuationSection.title) {
                    continuationSection.title = bundle.section.title;
                    if (bundle.section.subtitle) {
                        continuationSection.subtitle = bundle.section.subtitle;
                    }
                }
                let targetSectionForFilters = continuationSection;
                let targetSectionForButtons = continuationSection;
                if (bundle.section?.filtersFromParent || bundle.section?.buttonsFromParent) {
                    const parentSection = {
                        type: 'section',
                        items: [continuationSection]
                    };
                    contents.sections[0] = parentSection;
                    if (bundle.section.filtersFromParent) {
                        targetSectionForFilters = parentSection;
                    }
                    if (bundle.section.buttonsFromParent) {
                        targetSectionForButtons = parentSection;
                    }
                }
                if (bundle.section?.filters) {
                    targetSectionForFilters.filters = bundle.section.filters;
                }
                if (bundle.section?.buttons) {
                    targetSectionForButtons.buttons = bundle.section.buttons;
                }
            }
        }
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderToListItem(data, contents) {
        switch (data.type) {
            case 'channel':
                return this.getRenderer(renderers_1.RendererType.Channel).renderToListItem(data);
            case 'endpointLink':
                return this.getRenderer(renderers_1.RendererType.EndpointLink).renderToListItem(data);
            case 'playlist':
                return this.getRenderer(renderers_1.RendererType.Playlist).renderToListItem(data);
            case 'album':
                return this.getRenderer(renderers_1.RendererType.Album).renderToListItem(data);
            case 'video':
            case 'song':
                return this.getRenderer(renderers_1.RendererType.MusicItem).renderToListItem(data);
            case 'option':
            case 'continuationBundleOption':
                return this.getRenderer(renderers_1.RendererType.Option).renderToListItem(data);
            default:
                return null;
        }
    }
    getAvailableListViews(section) {
        const items = section.items.filter((item) => item.type !== 'section');
        if (items.every((item) => item.type === 'channel' || item.type === 'album' || item.type === 'playlist')) {
            return ['grid'];
        }
        if (section.itemLayout !== undefined) {
            return [section.itemLayout];
        }
        // Note: Volumio only enforces availableListViews = ['list']. If a list is set to ['grid'], it can still be switched to list
        // If there are other switchable lists and the user clicks the switch view button.
        const isBrowseEndpointLinkWithIcon = (item) => item.type === 'endpointLink' &&
            item.icon && !item.icon.startsWith('YTMUSIC_') &&
            !EndpointHelper_1.default.isType(item.endpoint, Endpoint_1.EndpointType.Watch);
        if (items.length === 0 ||
            !items.some((item) => item.type !== 'section' && isBrowseEndpointLinkWithIcon(item)) ||
            items.every((item) => item.type === 'song')) {
            return ['list'];
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
_FeedViewHandler_instances = new WeakSet(), _FeedViewHandler_sectionToLists = function _FeedViewHandler_sectionToLists(contents, section, header, parentContinuationBundle) {
    const listsForSection = [];
    const continuationBundle = this.createContinuationBundle(contents, section);
    const passOnBundle = JSON.parse(JSON.stringify(continuationBundle));
    if (parentContinuationBundle) {
        if (!passOnBundle.section.filters) {
            passOnBundle.section.filters = parentContinuationBundle.section.filters;
            passOnBundle.section.filtersFromParent = true;
        }
        if (!passOnBundle.section.buttons) {
            passOnBundle.section.buttons = parentContinuationBundle.section.buttons;
            passOnBundle.section.buttonsFromParent = true;
        }
    }
    let hasNestedSections = false; // Talking about nested sections with actual contents
    // List: section main items
    const mainItems = [];
    const commonAutoplayContext = AutoplayHelper_1.default.getAutoplayContext(section.items.filter((item) => item.type !== 'section'));
    // Disregard nested section when determining if every item is song / video, because
    // The nested section will be converted to separate list(s).
    const isAllMusicItems = section.items.every((item) => item.type === 'section' || item.type === 'song' || item.type === 'video');
    section.items?.forEach((item) => {
        if (item.type === 'section') {
            const nestedSectionToLists = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_sectionToLists).call(this, contents, item, header, passOnBundle);
            if (nestedSectionToLists.length > 0) {
                listsForSection.push(...nestedSectionToLists);
                hasNestedSections = true;
            }
        }
        else {
            const isMusicItem = item.type === 'video' || item.type === 'song';
            if (isMusicItem) {
                const autoplayContext = commonAutoplayContext || AutoplayHelper_1.default.getAutoplayContext(item);
                if (autoplayContext) {
                    item.autoplayContext = autoplayContext;
                }
            }
            const listItem = this.renderToListItem(item, contents);
            if (listItem) {
                if (isMusicItem && !isAllMusicItems) {
                    // Setting type to 'album' ensures only this item will get exploded when clicked. The exception
                    // Is when listing songs / videos in a playlist.
                    listItem.type = 'album';
                }
                mainItems.push(listItem);
            }
        }
    });
    if (mainItems.length > 0) {
        listsForSection.unshift({
            availableListViews: this.getAvailableListViews(section),
            items: mainItems
        });
    }
    // Section title
    const prevItemCount = __classPrivateFieldGet(this, _FeedViewHandler_instances, "m", _FeedViewHandler_getContinuationPrevItemCount).call(this);
    const currentItemCount = prevItemCount + mainItems.length;
    const isNextContinuation = EndpointHelper_1.default.isType(section.continuation?.endpoint, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.SearchContinuation);
    const showingResultsText = mainItems.length > 0 && (isNextContinuation ||
        (contents.type === 'page' && contents.isContinuation && prevItemCount > 0)) ?
        YTMusicContext_1.default.getI18n('YTMUSIC_SHOWING_RESULTS', prevItemCount + 1, currentItemCount) : null;
    let sectionTitle = section.title /*|| (!header ? contents.header?.title : undefined)*/;
    if (section.subtitle) {
        sectionTitle = sectionTitle ? `${sectionTitle}: ${section.subtitle}` : section.subtitle;
    }
    if (showingResultsText) {
        if (!sectionTitle && !header && contents.header?.title) {
            sectionTitle = contents.header.title;
        }
        if (sectionTitle) {
            sectionTitle = `${sectionTitle} (${showingResultsText.charAt(0).toLocaleLowerCase()}${showingResultsText.substring(1)})`;
        }
        else {
            sectionTitle = showingResultsText;
        }
    }
    if (section.continuation) {
        const continuationItem = this.constructContinuationItem({
            continuation: section.continuation,
            prevItemCount: isNextContinuation ? currentItemCount : 0,
            bundle: passOnBundle
        });
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
        const view = this.currentView;
        const currentViewEndpoint = view.endpoint || null;
        if (EndpointHelper_1.default.isType(currentViewEndpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation)) {
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
    // -- Buttons
    if (continuationBundle.section?.buttons) {
        const defaultDest = dataStartItems.length === 0 ? dataStartItems : dataEndItems;
        continuationBundle.section.buttons.forEach((button) => {
            const buttonEndpointItem = {
                type: 'endpointLink',
                title: button.text,
                endpoint: button.endpoint
            };
            switch (button.placement) {
                case 'top':
                    dataStartItems.push(buttonEndpointItem);
                    break;
                case 'bottom':
                    dataEndItems.push(buttonEndpointItem);
                    break;
                default:
                    defaultDest.push(buttonEndpointItem);
            }
        });
    }
    const startItems = dataStartItems.reduce((rendered, data) => {
        const listItem = this.renderToListItem(data, contents);
        if (listItem) {
            rendered.push(listItem);
        }
        return rendered;
    }, []);
    const endItems = dataEndItems.reduce((rendered, data) => {
        const listItem = this.renderToListItem(data, contents);
        if (listItem) {
            rendered.push(listItem);
        }
        return rendered;
    }, []);
    if (startItems.length > 0) {
        listsForSection.unshift({
            availableListViews: ['list'],
            items: [...startItems],
            isFiltersAndButtons: true
        });
    }
    if (endItems.length > 0) {
        listsForSection.push({
            availableListViews: ['list'],
            items: [...endItems],
            isFiltersAndButtons: true
        });
    }
    // Set section title
    if (listsForSection.length > 0 && !listsForSection[0].title) {
        listsForSection[0].title = sectionTitle;
    }
    const hasChipCloudTypeFilter = section.filters ? section.filters.some((filter) => filter.subtype === 'chipCloud') : false;
    if (mainItems.length === 0 && !hasNestedSections && (sectionTitle || hasChipCloudTypeFilter)) {
        listsForSection.push({
            title: sectionTitle,
            availableListViews: ['list'],
            items: []
        });
    }
    return listsForSection;
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
        subtype: 'tab',
        optionValues: tabs
    };
};
//# sourceMappingURL=FeedViewHandler.js.map