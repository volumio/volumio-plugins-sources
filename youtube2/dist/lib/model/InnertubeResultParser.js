"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _InnertubeResultParser_parseWatchContinuationEndpointResult, _InnertubeResultParser_parseWatchEndpointResult, _InnertubeResultParser_parseSearchEndpointResult, _InnertubeResultParser_parseBrowseEndpointResult, _InnertubeResultParser_parseHeader, _InnertubeResultParser_parseContentToSection, _InnertubeResultParser_parseContentItem, _InnertubeResultParser_parseAuthor, _InnertubeResultParser_parseDuration, _InnertubeResultParser_parseContinuationItem, _InnertubeResultParser_parseButton;
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const Endpoint_1 = require("../types/Endpoint");
class InnertubeResultParser {
    static parseResult(data, originatingEndpointType) {
        switch (originatingEndpointType) {
            case Endpoint_1.EndpointType.Watch:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseWatchEndpointResult).call(this, data);
            case Endpoint_1.EndpointType.WatchContinuation:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseWatchContinuationEndpointResult).call(this, data);
            case Endpoint_1.EndpointType.Search:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseSearchEndpointResult).call(this, data);
            // Browse / BrowseContinuation / SearchContinuation
            default:
                return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseBrowseEndpointResult).call(this, data);
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
    static parseEndpoint(data) {
        if (!data) {
            return null;
        }
        const createPayload = (fields, payloadData) => {
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
                    return {
                        type: Endpoint_1.EndpointType.BrowseContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                }
                return {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: createPayload(['browseId', 'params'])
                };
            case '/search':
            case 'search':
                if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_SEARCH') {
                    return {
                        type: Endpoint_1.EndpointType.SearchContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                }
                return {
                    type: Endpoint_1.EndpointType.Search,
                    payload: createPayload(['query', 'params'])
                };
            case '/player':
                return {
                    type: Endpoint_1.EndpointType.Watch,
                    payload: createPayload(['videoId', 'playlistId', 'params', 'index'])
                };
            case 'next':
                if (data?.payload?.request === 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT') {
                    return {
                        type: Endpoint_1.EndpointType.WatchContinuation,
                        payload: {
                            token: data.payload.token
                        }
                    };
                }
                break;
            default:
        }
        if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_SHORTS') {
            // For now, forget about sequence and treat reelWatchEndpoints
            // As normal watch endpoints
            return {
                type: Endpoint_1.EndpointType.Watch,
                payload: createPayload(['videoId'])
            };
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
            const continuationItem = acItems.find((item) => item.type === 'ContinuationItem');
            const parsedContinuation = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, continuationItem);
            if (parsedContinuation && parsedContinuation.endpoint.type === Endpoint_1.EndpointType.WatchContinuation) {
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
    if (!Array.isArray(dataContents) && dataContents.type === 'TwoColumnWatchNextResults') {
        const twoColumnWatchNextResults = dataContents;
        // Playlist items
        const playlistData = twoColumnWatchNextResults.playlist;
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
        const autoplayEndpoint = this.parseEndpoint(twoColumnWatchNextResults.autoplay?.sets[0].autoplay_video);
        if (autoplayEndpoint) {
            result.autoplay = autoplayEndpoint;
        }
        // Related
        // - If user is signed out, related items appear directly under secondary_results
        // - If user is signed in, related items appear in ItemSection under secondary_results
        const itemSection = twoColumnWatchNextResults.secondary_results.firstOfType(volumio_youtubei_js_1.YTNodes.ItemSection);
        const relatedItemList = itemSection ? itemSection.contents : twoColumnWatchNextResults.secondary_results;
        if (relatedItemList) {
            const parsedItems = relatedItemList.map((item) => __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, item));
            result.related = {
                items: parsedItems.filter((item) => item?.type === 'video' || item?.type === 'playlist')
            };
            const continuationItem = relatedItemList.find((item) => item.type === 'ContinuationItem');
            const parsedContinuation = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, continuationItem);
            if (parsedContinuation && parsedContinuation.endpoint.type === Endpoint_1.EndpointType.WatchContinuation) {
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
    if (!Array.isArray(dataContents) && dataContents.type === 'TwoColumnSearchResults') {
        const twoColumnSearchResults = dataContents;
        return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseBrowseEndpointResult).call(this, { contents: twoColumnSearchResults.primary_contents });
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
            const header = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseHeader).call(this, dataHeader);
            if (header) {
                result.header = header;
            }
        }
    }
    const dataContents = this.unwrap(data.contents);
    if (dataContents && !Array.isArray(dataContents) && dataContents.hasKey('tabs')) {
        const tabs = this.unwrap(dataContents.tabs);
        if (tabs && Array.isArray(tabs)) {
            const reducedTabs = tabs.filter((tab) => tab.type !== 'ExpandableTab')
                .reduce((filtered, tab) => {
                const parseEndpoint = this.parseEndpoint(tab.endpoint);
                const tabTitle = this.unwrap(tab.title);
                if (parseEndpoint && tabTitle) {
                    filtered.push({
                        text: tabTitle,
                        endpoint: parseEndpoint,
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
}, _InnertubeResultParser_parseHeader = function _InnertubeResultParser_parseHeader(data) {
    if (!data) {
        return null;
    }
    let type = null, title = null, subtitles = [], description = null, thumbnail = null, endpoint = null, author = null, shufflePlay = null;
    if (data.type === 'FeedTabbedHeader') {
        type = 'feed';
        const fthData = data;
        title = this.unwrap(fthData.title);
    }
    // Channel
    else if (data.type === 'C4TabbedHeader') {
        type = 'channel';
        const c4thData = data;
        title = this.unwrap(c4thData.author?.name);
        thumbnail = this.parseThumbnail(c4thData.author?.thumbnails);
        if (c4thData.subscribers) {
            const subscribers = this.unwrap(c4thData.subscribers);
            if (subscribers) {
                subtitles.push(subscribers);
            }
        }
        if (c4thData.videos_count) {
            const videosCount = this.unwrap(c4thData.videos_count);
            if (videosCount) {
                subtitles.push(videosCount);
            }
        }
        endpoint = this.parseEndpoint(c4thData.author?.endpoint);
    }
    // E.g. Gaming channel
    else if (data.type === 'InteractiveTabbedHeader') {
        type = 'channel';
        const ithData = data;
        title = this.unwrap(ithData.title);
        thumbnail = this.parseThumbnail(ithData.box_art);
        const ithMetadata = this.unwrap(ithData.metadata);
        if (ithMetadata) {
            subtitles.push(ithMetadata);
        }
        description = this.unwrap(ithData.description);
    }
    // Playlist
    else if (data.type === 'PlaylistHeader') {
        type = 'playlist';
        const plData = data;
        title = this.unwrap(plData.title);
        if (plData.stats) {
            subtitles = plData.stats.map((stat) => this.unwrap(stat));
        }
        const plVideoCount = this.unwrap(plData.num_videos);
        if (plVideoCount) {
            subtitles.push(plVideoCount);
        }
        description = this.unwrap(plData.description);
        if (plData.banner?.hasKey('thumbnails')) {
            thumbnail = this.parseThumbnail(plData.banner.thumbnails);
        }
        if (plData.banner?.hasKey('on_tap_endpoint')) {
            endpoint = this.parseEndpoint(plData.banner.on_tap_endpoint); // Watch endpoint
        }
        author = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, plData.author);
        const shufflePlayButton = this.unwrap(plData.shuffle_play_button);
        if (shufflePlayButton && !Array.isArray(shufflePlayButton) && shufflePlayButton.hasKey('endpoint') && shufflePlayButton.hasKey('text')) {
            const shufflePlayEndpoint = this.parseEndpoint(shufflePlayButton?.endpoint);
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
    else if (data.type === 'CarouselHeader') {
        const chData = data;
        const details = chData.contents.find((header) => header.type === 'TopicChannelDetails');
        if (details) {
            const tcdData = details;
            type = 'channel';
            title = this.unwrap(tcdData.title);
            thumbnail = this.parseThumbnail(tcdData.avatar);
            endpoint = this.parseEndpoint(tcdData.endpoint);
            const detailsSubtitle = this.unwrap(tcdData.subtitle);
            if (detailsSubtitle) {
                subtitles.push(detailsSubtitle);
            }
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
        else if (contentItem.type === 'ContinuationItem') {
            const continuationItem = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContinuationItem).call(this, contentItem);
            if (continuationItem && (continuationItem.endpoint.type === Endpoint_1.EndpointType.BrowseContinuation ||
                continuationItem.endpoint.type === Endpoint_1.EndpointType.SearchContinuation)) {
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
    if (dataHeader?.type === 'FeedFilterChipBar') {
        const chips = dataHeader.contents;
        /**
         * Note that, unlike other 'option.optionValues' type arrays, we don't
         * validate endpoint for FeedFilterChipBar. This is because the selected
         * chip does actually not provide an endpoint, but we don't want to
         * exclude it from the filters.
         */
        const dataFilters = chips?.filter((chip) => chip.type === 'ChipCloudChip')
            .map((chip) => {
            const endpoint = this.parseEndpoint(chip.endpoint);
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
    if (data.sub_menu?.type === 'SearchSubMenu') {
        // One filter per group
        const ssmData = data.sub_menu;
        const searchFilters = ssmData.groups?.reduce((filters, group) => {
            const title = this.unwrap(group.title);
            const optionValues = group.filters?.filter((f) => !f.disabled)
                .reduce((result, f) => {
                const endpoint = this.parseEndpoint(f.endpoint);
                if (endpoint) {
                    result.push({
                        text: this.unwrap(f.label),
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
    const dataEndpoint = this.parseEndpoint(data.endpoint);
    if (dataTitle) {
        section.title = dataTitle;
    }
    if (dataEndpoint) {
        section.endpoint = dataEndpoint;
    }
    // Menus
    const sectionMenus = [];
    // SectionList.ChannelSubMenu
    if (data.sub_menu?.type === 'ChannelSubMenu') {
        const cssData = data.sub_menu;
        const contentTypeMenu = {
            type: 'option',
            optionValues: cssData.content_type_sub_menu_items.reduce((result, item) => {
                const endpoint = this.parseEndpoint(item.endpoint);
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
        const sortSetting = cssData.sort_setting; // SortFilterSubMenu
        if (sortSetting && sortSetting.sub_menu_items) {
            const sortFilterMenu = {
                type: 'option',
                title: sortSetting.title,
                optionValues: sortSetting.sub_menu_items.reduce((result, item) => {
                    const endpoint = this.parseEndpoint(item.endpoint);
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
            return {
                type: 'video',
                videoId: vData.id || vData.video_id,
                title: this.unwrap(vData.title),
                author: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, vData.author),
                thumbnail: this.parseThumbnail(vData.thumbnails || vData.thumbnail) || null,
                viewCount: this.unwrap(vData.view_count) || this.unwrap(vData.views),
                published: this.unwrap(vData.published),
                duration: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseDuration).call(this, vData.duration),
                endpoint: this.parseEndpoint(vData.endpoint)
            };
        case 'CompactStation': // Masquerade as playlist
            const csData = data;
            return {
                type: 'playlist',
                title: this.unwrap(csData.title),
                thumbnail: this.parseThumbnail(csData.thumbnail),
                videoCount: this.unwrap(csData.video_count),
                endpoint: this.parseEndpoint(csData.endpoint) // Watch endpoint
            };
        case 'GameCard':
            const gcData = data;
            const gameData = gcData.game.type === 'GameDetails' ? gcData.game : null;
            if (gameData) {
                return {
                    type: 'channel',
                    name: this.unwrap(gameData.title),
                    channelId: gameData.endpoint.payload.browseId,
                    thumbnail: this.parseThumbnail(gameData.box_art) || null,
                    endpoint: this.parseEndpoint(gameData.endpoint)
                };
            }
            return null;
        case 'Playlist':
        case 'GridPlaylist':
        case 'Mix':
        case 'GridMix':
        case 'CompactMix':
            const plData = data;
            const playlistItem = {
                type: 'playlist',
                playlistId: plData.id,
                title: this.unwrap(plData.title),
                thumbnail: this.parseThumbnail(plData.thumbnails) || null,
                author: __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, plData.author),
                videoCount: this.unwrap(plData.video_count),
                endpoint: this.parseEndpoint(plData.endpoint),
                isMix: data.type.includes('Mix')
            };
            const plBrowseEndpoint = this.parseEndpoint(plData.view_playlist?.endpoint);
            if (plBrowseEndpoint) { // Browse endpoint for GridPlaylist
                playlistItem.browseEndpoint = plBrowseEndpoint;
            }
            return playlistItem;
        case 'Channel':
        case 'GridChannel':
            const chData = data;
            const dataAuthor = __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseAuthor).call(this, chData.author);
            if (dataAuthor) {
                const result = {
                    type: 'channel',
                    channelId: chData.id,
                    name: dataAuthor.name,
                    thumbnail: dataAuthor.thumbnail,
                    subscribers: this.unwrap(chData.subscribers),
                    endpoint: this.parseEndpoint(chData.endpoint)
                };
                return result;
            }
            return null;
        case 'GuideEntry':
            const geData = data;
            return {
                type: 'guideEntry',
                title: this.unwrap(geData.title),
                thumbnail: this.parseThumbnail(geData.thumbnails),
                icon: geData.icon_type,
                endpoint: this.parseEndpoint(geData.endpoint),
                isPrimary: geData.is_primary
            };
        case 'RichItem':
            const riData = data;
            return __classPrivateFieldGet(this, _a, "m", _InnertubeResultParser_parseContentItem).call(this, riData.content);
        case 'ShowingResultsFor':
            const srfData = data;
            const showResultsForText = `${this.unwrap(srfData.showing_results_for)} ${this.unwrap(srfData.corrected_query)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.unwrap(srfData.search_instead_for)} ${this.unwrap(srfData.original_query)}`;
            return {
                type: 'endpointLink',
                title: showResultsForText,
                icon: 'YT2_SHOWING_RESULTS_FOR',
                endpoint: this.parseEndpoint(srfData.original_query_endpoint)
            };
        default:
            return null;
    }
}, _InnertubeResultParser_parseAuthor = function _InnertubeResultParser_parseAuthor(data) {
    if (!data) {
        return null;
    }
    if (typeof data === 'string' || data instanceof volumio_youtubei_js_1.Misc.Text) {
        return {
            name: this.unwrap(data)
        };
    }
    return {
        channelId: data.id,
        name: this.unwrap(data.name),
        thumbnail: this.parseThumbnail(data.thumbnails),
        endpoint: this.parseEndpoint(data.endpoint)
    };
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
}, _InnertubeResultParser_parseContinuationItem = function _InnertubeResultParser_parseContinuationItem(data) {
    if (!data) {
        return null;
    }
    const endpoint = this.parseEndpoint(data.endpoint);
    if (!endpoint || (endpoint.type !== Endpoint_1.EndpointType.BrowseContinuation &&
        endpoint.type !== Endpoint_1.EndpointType.SearchContinuation && endpoint.type !== Endpoint_1.EndpointType.WatchContinuation)) {
        return null;
    }
    const result = {
        type: 'continuation',
        endpoint: { ...endpoint, type: endpoint.type }
    };
    if (data.button?.hasKey('text')) {
        result.text = this.unwrap(data.button.text);
    }
    return result;
}, _InnertubeResultParser_parseButton = function _InnertubeResultParser_parseButton(data) {
    if (!data) {
        return null;
    }
    const buttonEndpoint = this.parseEndpoint(data.endpoint);
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