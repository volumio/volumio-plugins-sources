"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _InnertubeResultParser_parseWatchContinuationEndpointResult, _InnertubeResultParser_parseWatchEndpointResult, _InnertubeResultParser_parseSearchEndpointResult, _InnertubeResultParser_parseBrowseEndpointResult, _InnertubeResultParser_parseHeader, _InnertubeResultParser_parseContentToSection, _InnertubeResultParser_parseContentItem, _InnertubeResultParser_parseAuthor, _InnertubeResultParser_parseDuration, _InnertubeResultParser_parseContinuationItem, _InnertubeResultParser_parseButton;
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const Endpoint_1 = require("../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("../util/EndpointHelper"));
class InnertubeResultParser {
    static parseResult(data, originatingEndpoint) {
        switch (originatingEndpoint?.type || Endpoint_1.EndpointType.Browse) {
            case Endpoint_1.EndpointType.Watch:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseWatchEndpointResult).call(this, data);
            case Endpoint_1.EndpointType.WatchContinuation:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseWatchContinuationEndpointResult).call(this, data);
            case Endpoint_1.EndpointType.Search:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseSearchEndpointResult).call(this, data);
            case Endpoint_1.EndpointType.Browse:
            case Endpoint_1.EndpointType.BrowseContinuation:
            case Endpoint_1.EndpointType.SearchContinuation:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseBrowseEndpointResult).call(this, data);
            default:
                return null;
        }
    }
    static unwrap(data) {
        if (typeof data === 'object' && data?.constructor.name === 'SuperParsedResult') {
            if (data.is_null) {
                return null;
            }
            else if (data.is_array) {
                return data.array();
            }
            else if (data.is_node) {
                return data.item();
            }
            return data;
        }
        else if (typeof data === 'string' || data instanceof volumio_youtubei_js_1.Misc.Text) {
            const s = (typeof data === 'string') ? data : data.toString();
            return (s === 'N/A' || s === '') ? null : s;
        }
        return data;
    }
    static parseThumbnail(data) {
        const url = data?.[0]?.url;
        if (url?.startsWith('//')) {
            return `https:${url}`;
        }
        return url || null;
    }
    static parseEndpoint(data, ...requireTypes) {
        if (!data) {
            return null;
        }
        const __checkType = (endpoint) => {
            if (!endpoint) {
                return null;
            }
            if (requireTypes.length === 0) {
                return endpoint;
            }
            return EndpointHelper_1.default.isType(endpoint, ...requireTypes) ? endpoint : null;
        };
        const __createPayload = (fields, payloadData) => {
            const payload = {};
            const src = payloadData || data?.payload;
            if (src) {
                for (const field of fields) {
                    if (src[field] !== undefined) {
                        payload[field] = src[field];
                    }
                }
            }
            return payload;
        };
        switch (data?.metadata?.api_url) {
            case '/browse':
            case 'browse':
                if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_BROWSE') {
                    const result = {
                        type: Endpoint_1.EndpointType.BrowseContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                    return __checkType(result);
                }
                const beResult = {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: __createPayload(['browseId', 'params'])
                };
                return __checkType(beResult);
            case '/search':
            case 'search':
                if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_SEARCH') {
                    const result = {
                        type: Endpoint_1.EndpointType.SearchContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                    return __checkType(result);
                }
                const seResult = {
                    type: Endpoint_1.EndpointType.Search,
                    payload: __createPayload(['query', 'params'])
                };
                return __checkType(seResult);
            case '/player':
                const weResult = {
                    type: Endpoint_1.EndpointType.Watch,
                    payload: __createPayload(['videoId', 'playlistId', 'params', 'index'])
                };
                return __checkType(weResult);
            case '/next':
            case 'next':
                if (data?.payload?.request === 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT') {
                    const result = {
                        type: Endpoint_1.EndpointType.WatchContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                    return __checkType(result);
                }
                if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_WATCH') {
                    const weResult = {
                        type: Endpoint_1.EndpointType.Watch,
                        payload: __createPayload(['videoId', 'playlistId', 'params', 'index'])
                    };
                    return __checkType(weResult);
                }
                break;
            default:
        }
        if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_SHORTS') {
            // For now, forget about sequence and treat reelWatchEndpoints
            // As normal watch endpoints
            const result = {
                type: Endpoint_1.EndpointType.Watch,
                payload: __createPayload(['videoId'])
            };
            return __checkType(result);
        }
        return null;
    }
}
exports.default = InnertubeResultParser;
_a = InnertubeResultParser, _InnertubeResultParser_parseWatchContinuationEndpointResult = function _InnertubeResultParser_parseWatchContinuationEndpointResult(data) {
    const itemContinuations = data.on_response_received_endpoints || null;
    if (itemContinuations && itemContinuations.length > 0) {
        const actions = itemContinuations.filter((c) => c.type === 'appendContinuationItemsAction');
        if (actions) {
            const acItems = actions.reduce((result, ac) => {
                if (ac.contents) {
                    result.push(...ac.contents);
                }
                return result;
            }, []);
            const parsedItems = acItems.reduce((result, item) => {
                const parsedItem = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, item);
                if (parsedItem && (parsedItem.type === 'video' || parsedItem.type === 'playlist')) {
                    result.push(parsedItem);
                }
                return result;
            }, []);
            const watchContinuationContent = {
                type: 'watch',
                isContinuation: true,
                items: parsedItems
            };
            const continuationItem = acItems.find((item) => item instanceof volumio_youtubei_js_1.YTNodes.ContinuationItem);
            const parsedContinuation = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, continuationItem, Endpoint_1.EndpointType.WatchContinuation);
            if (parsedContinuation) {
                watchContinuationContent.continuation = parsedContinuation;
            }
            return watchContinuationContent;
        }
    }
    return null;
}, _InnertubeResultParser_parseWatchEndpointResult = function _InnertubeResultParser_parseWatchEndpointResult(data) {
    const dataContents = this.unwrap(data.contents);
    if (!dataContents) {
        return null;
    }
    const result = { type: 'watch', isContinuation: false };
    if (dataContents instanceof volumio_youtubei_js_1.YTNodes.TwoColumnWatchNextResults) {
        // Playlist items
        const playlistData = dataContents.playlist;
        if (playlistData) {
            const playlistItems = playlistData.contents.reduce((items, itemData) => {
                const parsedItem = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, itemData);
                if (parsedItem && parsedItem.type === 'video') {
                    items.push(parsedItem);
                }
                return items;
            }, []);
            result.playlist = {
                type: 'playlist',
                playlistId: playlistData.id,
                title: playlistData.title,
                items: playlistItems,
                currentIndex: playlistData.current_index
            };
            const playlistAuthor = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, playlistData.author);
            if (playlistAuthor) {
                result.playlist.author = playlistAuthor;
            }
        }
        // Autoplay item
        const autoplayEndpoint = this.parseEndpoint(dataContents.autoplay?.sets[0].autoplay_video, Endpoint_1.EndpointType.Watch);
        if (autoplayEndpoint) {
            result.autoplay = autoplayEndpoint;
        }
        // Related
        // - If user is signed out, related items appear directly under secondary_results
        // - If user is signed in, related items appear in ItemSection under secondary_results
        const itemSection = dataContents.secondary_results.firstOfType(volumio_youtubei_js_1.YTNodes.ItemSection);
        const relatedItemList = itemSection ? itemSection.contents : dataContents.secondary_results;
        if (relatedItemList) {
            const parsedItems = relatedItemList.map((item) => __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, item));
            result.related = {
                items: parsedItems.filter((item) => item?.type === 'video' || item?.type === 'playlist')
            };
            const continuationItem = relatedItemList.find((item) => item instanceof volumio_youtubei_js_1.YTNodes.ContinuationItem);
            const parsedContinuation = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, continuationItem, Endpoint_1.EndpointType.WatchContinuation);
            if (parsedContinuation) {
                result.related.continuation = parsedContinuation;
            }
        }
        return result;
    }
    return null;
}, _InnertubeResultParser_parseSearchEndpointResult = function _InnertubeResultParser_parseSearchEndpointResult(data) {
    const dataContents = this.unwrap(data.contents);
    if (!dataContents) {
        return null;
    }
    if (dataContents instanceof volumio_youtubei_js_1.YTNodes.TwoColumnSearchResults) {
        return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseBrowseEndpointResult).call(this, { contents: dataContents.primary_contents });
    }
    return null;
}, _InnertubeResultParser_parseBrowseEndpointResult = function _InnertubeResultParser_parseBrowseEndpointResult(data) {
    const itemContinuations = data.on_response_received_actions ||
        data.on_response_received_endpoints ||
        data.on_response_received_commands || null;
    if (itemContinuations && itemContinuations.length > 0) {
        const actionOrCommands = itemContinuations.filter((c) => c.type === 'appendContinuationItemsAction' ||
            c.type === 'reloadContinuationItemsCommand');
        if (actionOrCommands) {
            const sections = actionOrCommands.reduce((sections, ac) => {
                const parsedSection = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentToSection).call(this, { content: this.unwrap(ac.contents) });
                if (parsedSection) {
                    sections.push(parsedSection);
                }
                return sections;
            }, []);
            if (sections) {
                return {
                    type: 'page',
                    isContinuation: true,
                    sections
                };
            }
            return null;
        }
    }
    const result = {
        type: 'page',
        isContinuation: false,
        sections: []
    };
    if (data.header) {
        const dataHeader = this.unwrap(data.header);
        if (dataHeader && !Array.isArray(dataHeader)) {
            const metadata = this.unwrap(data.metadata);
            const header = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseHeader).call(this, dataHeader, !Array.isArray(metadata) ? metadata : null);
            if (header) {
                result.header = header;
            }
        }
    }
    const dataContents = this.unwrap(data.contents);
    if (dataContents && !Array.isArray(dataContents) && dataContents.hasKey('tabs')) {
        const tabs = this.unwrap(dataContents.tabs);
        if (tabs && Array.isArray(tabs)) {
            const reducedTabs = tabs.filter((tab) => !(tab.type instanceof volumio_youtubei_js_1.YTNodes.ExpandableTab))
                .reduce((filtered, tab) => {
                const tabEndpoint = this.parseEndpoint(tab.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation);
                const tabTitle = this.unwrap(tab.title);
                if (tabEndpoint && tabTitle) {
                    filtered.push({
                        text: tabTitle,
                        endpoint: tabEndpoint,
                        selected: !!tab.selected
                    });
                }
                return filtered;
            }, []);
            if (reducedTabs.length > 0) {
                result.tabs = reducedTabs;
            }
            const selectedTab = tabs.find((tab) => tab.selected);
            if (selectedTab) {
                const parsedSection = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentToSection).call(this, selectedTab.content);
                if (parsedSection) {
                    result.sections.push(parsedSection);
                }
            }
        }
    }
    else {
        const parsedSection = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentToSection).call(this, { content: dataContents });
        if (parsedSection) {
            result.sections.push(parsedSection);
        }
    }
    return result;
}, _InnertubeResultParser_parseHeader = function _InnertubeResultParser_parseHeader(data, metadata) {
    if (!data) {
        return null;
    }
    let type = null, title = null, subtitles = [], description = null, thumbnail = null, endpoint = null, author = null, shufflePlay = null;
    if (data instanceof volumio_youtubei_js_1.YTNodes.FeedTabbedHeader) {
        type = 'feed';
        title = this.unwrap(data.title);
    }
    // Channel
    else if (data instanceof volumio_youtubei_js_1.YTNodes.C4TabbedHeader) {
        type = 'channel';
        title = this.unwrap(data.author?.name);
        thumbnail = this.parseThumbnail(data.author?.thumbnails);
        if (data.subscribers) {
            const subscribers = this.unwrap(data.subscribers);
            if (subscribers) {
                subtitles.push(subscribers);
            }
        }
        if (data.videos_count) {
            const videosCount = this.unwrap(data.videos_count);
            if (videosCount) {
                subtitles.push(videosCount);
            }
        }
        endpoint = this.parseEndpoint(data.author?.endpoint, Endpoint_1.EndpointType.Browse);
    }
    // E.g. Gaming channel
    else if (data instanceof volumio_youtubei_js_1.YTNodes.InteractiveTabbedHeader) {
        type = 'channel';
        title = this.unwrap(data.title);
        thumbnail = this.parseThumbnail(data.box_art);
        const ithMetadata = this.unwrap(data.metadata);
        if (ithMetadata) {
            subtitles.push(ithMetadata);
        }
        description = this.unwrap(data.description);
    }
    // Playlist
    else if (data instanceof volumio_youtubei_js_1.YTNodes.PlaylistHeader) {
        type = 'playlist';
        title = this.unwrap(data.title);
        if (data.stats) {
            subtitles = data.stats.reduce((result, stat) => {
                const s = this.unwrap(stat);
                if (s) {
                    result.push(s);
                }
                return result;
            }, []);
        }
        const plVideoCount = this.unwrap(data.num_videos);
        if (plVideoCount) {
            subtitles.push(plVideoCount);
        }
        description = this.unwrap(data.description);
        if (data.banner?.hasKey('thumbnails')) {
            thumbnail = this.parseThumbnail(data.banner.thumbnails);
        }
        if (data.banner?.hasKey('on_tap_endpoint')) {
            endpoint = this.parseEndpoint(data.banner.on_tap_endpoint, Endpoint_1.EndpointType.Watch);
        }
        author = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, data.author);
        const shufflePlayButton = this.unwrap(data.shuffle_play_button);
        if (shufflePlayButton && !Array.isArray(shufflePlayButton) && shufflePlayButton.hasKey('endpoint') && shufflePlayButton.hasKey('text')) {
            const shufflePlayEndpoint = this.parseEndpoint(shufflePlayButton?.endpoint, Endpoint_1.EndpointType.Watch);
            if (shufflePlayEndpoint) {
                shufflePlay = {
                    type: 'endpointLink',
                    title: this.unwrap(shufflePlayButton.text),
                    endpoint: shufflePlayEndpoint
                };
            }
        }
    }
    // Topic
    else if (data instanceof volumio_youtubei_js_1.YTNodes.CarouselHeader) {
        const details = data.contents.find((header) => header instanceof volumio_youtubei_js_1.YTNodes.TopicChannelDetails);
        if (details) {
            type = 'channel';
            title = this.unwrap(details.title);
            thumbnail = this.parseThumbnail(details.avatar);
            endpoint = this.parseEndpoint(details.endpoint, Endpoint_1.EndpointType.Browse);
            const detailsSubtitle = this.unwrap(details.subtitle);
            if (detailsSubtitle) {
                subtitles.push(detailsSubtitle);
            }
        }
    }
    // Generic PageHeader - need to check if 'channel' type
    else if (data instanceof volumio_youtubei_js_1.YTNodes.PageHeader && metadata instanceof volumio_youtubei_js_1.YTNodes.ChannelMetadata) {
        type = 'channel';
        title = this.unwrap(data.content?.title?.text);
        description = metadata.description;
        thumbnail = this.parseThumbnail(metadata.avatar);
        if (data.content?.metadata?.metadata_rows) {
            for (const row of data.content?.metadata?.metadata_rows || []) {
                const parts = row.metadata_parts?.reduce((result, { text }) => {
                    const t = this.unwrap(text);
                    if (t) {
                        subtitles.push(t);
                    }
                    return result;
                }, []);
                if (parts) {
                    subtitles.push(...parts);
                }
            }
        }
        if (metadata.external_id) {
            endpoint = {
                type: Endpoint_1.EndpointType.Browse,
                payload: {
                    browseId: metadata.external_id
                }
            };
        }
    }
    if (type && title) {
        const result = {
            type,
            title
        };
        if (subtitles.length > 0) {
            result.subtitles = subtitles;
        }
        if (description) {
            result.description = description;
        }
        if (thumbnail) {
            result.thumbnail = thumbnail;
        }
        if (endpoint) {
            result.endpoint = endpoint;
        }
        if (type === 'playlist') {
            if (author) {
                result.author = author;
            }
            if (shufflePlay) {
                result.shufflePlay = shufflePlay;
            }
        }
        return result;
    }
    return null;
}, _InnertubeResultParser_parseContentToSection = function _InnertubeResultParser_parseContentToSection(data) {
    if (!data) {
        return null;
    }
    const nestedSectionTypes = [
        'SectionList',
        'ItemSection',
        'Shelf',
        'ReelShelf',
        'ExpandedShelfContents',
        'HorizontalList',
        'Grid',
        'PlaylistVideoList',
        'RichSection',
        'RichShelf',
        'HorizontalCardList',
        'HorizontalMovieList',
        'VerticalList',
        'GuideSection',
        'GuideSubscriptionsSection'
    ];
    const section = {
        type: 'section',
        items: []
    };
    const __parseContentItem = (contentItem) => {
        if (nestedSectionTypes.includes(contentItem.type)) {
            // Nested section
            const parsedNested = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentToSection).call(this, contentItem);
            if (parsedNested) {
                section.items.push(parsedNested);
            }
        }
        else if (contentItem instanceof volumio_youtubei_js_1.YTNodes.ContinuationItem) {
            const continuationItem = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, contentItem, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.SearchContinuation);
            if (continuationItem) {
                section.continuation = continuationItem;
            }
        }
        else {
            const mediaItem = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, contentItem);
            if (mediaItem) {
                section.items.push(mediaItem);
            }
        }
    };
    const dataHeader = data.header;
    // Property name for contents depend on data. E.g.:
    // Tab content / ItemSection / RichShelf: contents
    // Shelf / RichSection: content
    // HorizontalList / GuideSection / GuideSubscriptionsSection / ExpandedShelfContents / ReelShelf: items
    // PlaylistVideoList: videos
    // HorizontalCardList: cards
    const dataContents = this.unwrap(data.contents) || this.unwrap(data.content) ||
        this.unwrap(data.items) || this.unwrap(data.videos) || this.unwrap(data.cards);
    // Filters
    const sectionFilters = [];
    // FeedFilterChipBar
    if (dataHeader instanceof volumio_youtubei_js_1.YTNodes.FeedFilterChipBar) {
        const chips = dataHeader.contents;
        /**
         * Note that, unlike other 'option.optionValues' type arrays, we don't
         * validate endpoint for FeedFilterChipBar. This is because the selected
         * chip does actually not provide an endpoint, but we don't want to
         * exclude it from the filters.
         */
        const dataFilters = chips.map((chip) => {
            const endpoint = this.parseEndpoint(chip.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation);
            return {
                text: chip.text,
                endpoint,
                selected: !!chip.is_selected
            };
        });
        if (dataFilters.length > 0) {
            sectionFilters.push({
                type: 'option',
                optionValues: dataFilters
            });
        }
    }
    // SectionList.SearchSubMenu
    if (data.sub_menu instanceof volumio_youtubei_js_1.YTNodes.SearchSubMenu) {
        // One filter per group
        const searchFilters = data.sub_menu.groups.reduce((filters, group) => {
            const title = this.unwrap(group.title);
            if (title) {
                const optionValues = group.filters?.filter((f) => !f.disabled)
                    .reduce((result, f) => {
                    const endpoint = this.parseEndpoint(f.endpoint, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation);
                    const text = this.unwrap(f.label);
                    if (endpoint && text) {
                        result.push({
                            text,
                            endpoint,
                            selected: !!f.selected
                        });
                    }
                    return result;
                }, []);
                if (optionValues && optionValues.length > 0) {
                    filters.push({
                        type: 'option',
                        title,
                        optionValues
                    });
                }
            }
            return filters;
        }, []);
        if (searchFilters && searchFilters?.length > 0) {
            sectionFilters.push(...searchFilters);
        }
    }
    if (sectionFilters.length > 0) {
        section.filters = sectionFilters;
    }
    const dataTitle = this.unwrap(data.title || data.header?.title);
    const dataEndpoint = this.parseEndpoint(data.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation);
    if (dataTitle) {
        section.title = dataTitle;
    }
    if (dataEndpoint) {
        section.endpoint = dataEndpoint;
    }
    // Menus
    const sectionMenus = [];
    // SectionList.ChannelSubMenu
    if (data.sub_menu instanceof volumio_youtubei_js_1.YTNodes.ChannelSubMenu) {
        const contentTypeMenu = {
            type: 'option',
            optionValues: data.sub_menu.content_type_sub_menu_items.reduce((result, item) => {
                const endpoint = this.parseEndpoint(item.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation);
                if (endpoint) {
                    result.push({
                        text: item.title,
                        endpoint,
                        selected: !!item.selected
                    });
                }
                return result;
            }, [])
        };
        // If menu only has one option, set that as section title instead (if not not already set)
        if (contentTypeMenu.optionValues.length > 1) {
            sectionMenus.push(contentTypeMenu);
        }
        else if (!section.title) {
            section.title = contentTypeMenu.optionValues[0]?.text;
        }
        const sortSetting = data.sub_menu.sort_setting; // SortFilterSubMenu
        if (sortSetting instanceof volumio_youtubei_js_1.YTNodes.SortFilterSubMenu && sortSetting.sub_menu_items) {
            const sortFilterMenu = {
                type: 'option',
                title: sortSetting.title,
                optionValues: sortSetting.sub_menu_items.reduce((result, item) => {
                    const endpoint = this.parseEndpoint(item.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation);
                    if (endpoint) {
                        result.push({
                            text: item.title,
                            endpoint,
                            selected: !!item.selected
                        });
                    }
                    return result;
                }, [])
            };
            sectionMenus.push(sortFilterMenu);
        }
    }
    if (sectionMenus.length > 0) {
        section.menus = sectionMenus;
    }
    // Buttons
    const sectionButtons = [];
    let topLevelButtons = null;
    if (data.menu?.hasKey('top_level_buttons')) {
        topLevelButtons = data.menu.top_level_buttons;
    }
    if (Array.isArray(topLevelButtons)) { // E.g. 'See All' button in Library
        for (const button of topLevelButtons.filter((button) => !button.is_disabled)) {
            const parsedButton = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseButton).call(this, button);
            if (parsedButton) {
                sectionButtons.push(parsedButton);
            }
        }
    }
    // PlayAllButton (e.g. in Channel -> Shelf)
    if (data.play_all_button) {
        const parsedButton = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseButton).call(this, data.play_all_button);
        if (parsedButton) {
            sectionButtons.push(parsedButton);
        }
    }
    if (sectionButtons.length > 0) {
        section.buttons = sectionButtons;
    }
    // TODO: `Shelf` has `sortFilter` not parsed by YouTube.js.
    // Seems to appear only in Library -> Playlists section. Should we
    // Include it?
    if (dataContents) {
        if (Array.isArray(dataContents)) {
            for (const contentItem of dataContents) {
                __parseContentItem(contentItem);
            }
        }
        else {
            __parseContentItem(dataContents);
        }
    }
    const hasFilters = section.filters && section.filters.length > 0;
    const hasMenus = section.menus && section.menus.length > 0;
    const hasButtons = section.buttons && section.buttons.length > 0;
    if (section.items.length > 0 || hasFilters || hasMenus ||
        hasButtons || section.title || section.continuation) {
        return section;
    }
    return null;
}, _InnertubeResultParser_parseContentItem = function _InnertubeResultParser_parseContentItem(data) {
    if (!data) {
        return null;
    }
    switch (data.type) {
        case 'Video':
        case 'CompactVideo':
        case 'VideoCard':
        case 'GridVideo':
        case 'PlaylistVideo':
        case 'ReelItem': // Published / author / duration  will be null
        case 'PlaylistPanelVideo': // Published / viewCount will be null
        case 'GridMovie': // Published / viewCount will be null
            const vData = data;
            const vDataTitle = this.unwrap(vData.title);
            const vDataEndpoint = this.parseEndpoint(vData.endpoint, Endpoint_1.EndpointType.Watch);
            if (vDataTitle && vDataEndpoint) {
                const vidResult = {
                    type: 'video',
                    videoId: vData.id || vData.video_id,
                    title: vDataTitle,
                    author: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, vData.author) || undefined,
                    thumbnail: this.parseThumbnail(vData.thumbnails || vData.thumbnail) || undefined,
                    viewCount: this.unwrap(vData.view_count) || this.unwrap(vData.views) || undefined,
                    published: this.unwrap(vData.published) || undefined,
                    duration: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseDuration).call(this, vData.duration) || undefined,
                    endpoint: vDataEndpoint
                };
                return vidResult;
            }
            return null;
        case 'CompactStation': // Masquerade as playlist
            const csData = data;
            const csDataTitle = this.unwrap(csData.title);
            const csDataEndpoint = this.parseEndpoint(csData.endpoint, Endpoint_1.EndpointType.Watch);
            if (csDataTitle && csDataEndpoint) {
                const plResult = {
                    type: 'playlist',
                    title: csDataTitle,
                    thumbnail: this.parseThumbnail(csData.thumbnail) || undefined,
                    videoCount: this.unwrap(csData.video_count) || undefined,
                    endpoint: csDataEndpoint
                };
                return plResult;
            }
            return null;
        case 'GameCard':
            const gcData = data;
            if (gcData.game instanceof volumio_youtubei_js_1.YTNodes.GameDetails) {
                const gcDataName = this.unwrap(gcData.game.title);
                const gcDataEndpoint = this.parseEndpoint(gcData.game.endpoint, Endpoint_1.EndpointType.Browse);
                if (gcDataName && gcDataEndpoint) {
                    const gcResult = {
                        type: 'channel',
                        name: gcDataName,
                        channelId: gcData.game.endpoint.payload.browseId,
                        thumbnail: this.parseThumbnail(gcData.game.box_art) || undefined,
                        endpoint: gcDataEndpoint
                    };
                    return gcResult;
                }
            }
            return null;
        case 'Playlist':
        case 'GridPlaylist':
        case 'Mix':
        case 'GridMix':
        case 'CompactMix':
            const plData = data;
            const plDataTitle = this.unwrap(plData.title);
            const plDataEndpoint = this.parseEndpoint(plData.endpoint, Endpoint_1.EndpointType.Watch);
            if (plDataTitle && plDataEndpoint) {
                const playlistItem = {
                    type: 'playlist',
                    playlistId: plData.id,
                    title: plDataTitle,
                    thumbnail: this.parseThumbnail(plData.thumbnails) || undefined,
                    author: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, plData.author) || undefined,
                    videoCount: this.unwrap(plData.video_count) || undefined,
                    endpoint: plDataEndpoint,
                    isMix: data.type.includes('Mix')
                };
                const plBrowseEndpoint = this.parseEndpoint(plData.view_playlist?.endpoint, Endpoint_1.EndpointType.Browse);
                if (plBrowseEndpoint) { // Browse endpoint for GridPlaylist
                    playlistItem.browseEndpoint = plBrowseEndpoint;
                }
                return playlistItem;
            }
            return null;
        case 'Channel':
        case 'GridChannel':
            const chData = data;
            const dataAuthor = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, chData.author);
            const chDataEndpoint = this.parseEndpoint(chData.endpoint, Endpoint_1.EndpointType.Browse);
            if (dataAuthor && chDataEndpoint) {
                const chResult = {
                    type: 'channel',
                    channelId: chData.id,
                    name: dataAuthor.name,
                    thumbnail: dataAuthor.thumbnail || undefined,
                    subscribers: this.unwrap(chData.subscribers) || undefined,
                    endpoint: chDataEndpoint
                };
                return chResult;
            }
            return null;
        case 'GuideEntry':
            const geData = data;
            const geDataTitle = this.unwrap(geData.title);
            const geDataEndpoint = this.parseEndpoint(geData.endpoint, Endpoint_1.EndpointType.Browse);
            if (geDataTitle && geDataEndpoint) {
                const geResult = {
                    type: 'guideEntry',
                    title: geDataTitle,
                    thumbnail: this.parseThumbnail(geData.thumbnails) || undefined,
                    icon: geData.icon_type || undefined,
                    endpoint: geDataEndpoint,
                    isPrimary: geData.is_primary
                };
                return geResult;
            }
            return null;
        case 'RichItem':
            const riData = data;
            return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, riData.content);
        case 'ShowingResultsFor':
            const srfData = data;
            const srfDataEndpoint = this.parseEndpoint(srfData.original_query_endpoint, Endpoint_1.EndpointType.Search);
            const showResultsForText = `${this.unwrap(srfData.showing_results_for)} ${this.unwrap(srfData.corrected_query)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.unwrap(srfData.search_instead_for)} ${this.unwrap(srfData.original_query)}`;
            if (srfDataEndpoint) {
                const srResult = {
                    type: 'endpointLink',
                    title: showResultsForText,
                    icon: 'YT2_SHOWING_RESULTS_FOR',
                    endpoint: srfDataEndpoint
                };
                return srResult;
            }
            return null;
        default:
            return null;
    }
}, _InnertubeResultParser_parseAuthor = function _InnertubeResultParser_parseAuthor(data) {
    if (!data) {
        return null;
    }
    if (typeof data === 'string') {
        return {
            name: data
        };
    }
    if (data instanceof volumio_youtubei_js_1.Misc.Text) {
        const authorName = this.unwrap(data);
        if (authorName) {
            return {
                name: authorName
            };
        }
        return null;
    }
    const authorName = this.unwrap(data.name);
    if (authorName) {
        return {
            channelId: data.id,
            name: authorName,
            thumbnail: this.parseThumbnail(data.thumbnails),
            endpoint: this.parseEndpoint(data.endpoint, Endpoint_1.EndpointType.Browse)
        };
    }
    return null;
}, _InnertubeResultParser_parseDuration = function _InnertubeResultParser_parseDuration(data) {
    if (!data) {
        return null;
    }
    if (data instanceof volumio_youtubei_js_1.Misc.Text) {
        const s = this.unwrap(data);
        if (s) {
            return volumio_youtubei_js_1.Utils.timeToSeconds(s);
        }
    }
    else if (typeof data === 'object' && data.seconds) {
        return data.seconds;
    }
    if (typeof data === 'string') {
        return volumio_youtubei_js_1.Utils.timeToSeconds(data);
    }
    return null;
}, _InnertubeResultParser_parseContinuationItem = function _InnertubeResultParser_parseContinuationItem(data, ...requireType) {
    if (!data) {
        return null;
    }
    const endpoint = this.parseEndpoint(data.endpoint, ...requireType);
    if (!endpoint) {
        return null;
    }
    const result = {
        type: 'continuation',
        endpoint
    };
    if (data.button?.hasKey('text')) {
        result.text = this.unwrap(data.button.text);
    }
    return result;
}, _InnertubeResultParser_parseButton = function _InnertubeResultParser_parseButton(data) {
    if (!data) {
        return null;
    }
    const buttonEndpoint = this.parseEndpoint(data.endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation, Endpoint_1.EndpointType.Watch);
    const buttonText = this.unwrap(data.text);
    if (buttonEndpoint && buttonText) {
        return {
            type: 'button',
            text: buttonText,
            endpoint: buttonEndpoint
        };
    }
    return null;
};
//# sourceMappingURL=InnertubeResultParser.js.map