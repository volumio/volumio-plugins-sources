import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Utils as YTUtils, Helpers as YTHelpers } from 'volumio-youtubei.js';
import Endpoint, { EndpointType } from '../types/Endpoint';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import PageContent from '../types/PageContent';
import { ContentItem, PageElement } from '../types';
import { Continuation, SectionItem } from '../types/PageElement';

type ParseableInnertubeResponse = INextResponse | ISearchResponse | IBrowseResponse;

type NestedSection = YTNodes.SectionList &
                     YTNodes.ItemSection &
                     YTNodes.Shelf &
                     YTNodes.ReelShelf &
                     YTNodes.ExpandedShelfContents &
                     YTNodes.HorizontalList &
                     YTNodes.Grid &
                     YTNodes.PlaylistVideoList &
                     YTNodes.RichSection &
                     YTNodes.RichShelf &
                     YTNodes.HorizontalCardList &
                     YTNodes.HorizontalMovieList &
                     YTNodes.VerticalList &
                     YTNodes.GuideSection &
                     YTNodes.GuideSubscriptionsSection;

type SectionContent = NestedSection |
                      (NestedSection &
                      YTNodes.Tab &
                      YTNodes.ReelShelf &
                      YTNodes.ExpandedShelfContents &
                      YTNodes.RichShelf) &
                      { content?: any };

export default class InnertubeResultParser {

  static parseResult(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpointType?: EndpointType.Browse | EndpointType.BrowseContinuation | EndpointType.Search | EndpointType.SearchContinuation) : PageContent | null;
  static parseResult(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpointType: EndpointType.Watch ) : WatchContent | null;
  static parseResult(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpointType: EndpointType.WatchContinuation ) : WatchContinuationContent | null;
  static parseResult(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpointType?: EndpointType): PageContent | WatchContent | WatchContinuationContent | null;
  static parseResult(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpointType?: EndpointType) {

    switch (originatingEndpointType) {
      case EndpointType.Watch:
        return this.#parseWatchEndpointResult(data as INextResponse);

      case EndpointType.WatchContinuation:
        return this.#parseWatchContinuationEndpointResult(data as INextResponse);

      case EndpointType.Search:
        return this.#parseSearchEndpointResult(data as ISearchResponse);

      // Browse / BrowseContinuation / SearchContinuation
      default:
        return this.#parseBrowseEndpointResult(data as IBrowseResponse);
    }
  }

  static #parseWatchContinuationEndpointResult(data: INextResponse): WatchContinuationContent | null {
    const itemContinuations = data.on_response_received_endpoints || null;

    if (itemContinuations && itemContinuations.length > 0) {
      const actions = itemContinuations.filter((c) =>
        c.type === 'appendContinuationItemsAction');
      if (actions) {
        const acItems = actions.reduce<YTHelpers.YTNode[]>((result, ac) => {
          if (ac.contents) {
            result.push(...ac.contents);
          }
          return result;
        }, []);
        const parsedItems = acItems.reduce<WatchContinuationContent['items']>((result, item) => {
          const parsedItem = this.#parseContentItem(item);
          if (parsedItem && (parsedItem.type === 'video' || parsedItem.type === 'playlist')) {
            result.push(parsedItem);
          }
          return result;
        }, []);
        const watchContinuationContent: WatchContinuationContent = {
          type: 'watch',
          isContinuation: true,
          items: parsedItems
        };
        const continuationItem = acItems.find((item) => item.type === 'ContinuationItem') as YTNodes.ContinuationItem;
        const parsedContinuation = this.#parseContinuationItem(continuationItem);
        if (parsedContinuation && parsedContinuation.endpoint.type === EndpointType.WatchContinuation) {
          watchContinuationContent.continuation = parsedContinuation as Continuation<typeof parsedContinuation.endpoint.type>;
        }

        return watchContinuationContent;
      }
    }

    return null;
  }

  static #parseWatchEndpointResult(data: INextResponse): WatchContent | null {
    const dataContents = this.unwrap(data.contents);
    if (!dataContents) {
      return null;
    }

    const result: WatchContent = { type: 'watch', isContinuation: false };

    if (!Array.isArray(dataContents) && dataContents.type === 'TwoColumnWatchNextResults') {
      const twoColumnWatchNextResults = dataContents as YTNodes.TwoColumnWatchNextResults;

      // Playlist items
      const playlistData = twoColumnWatchNextResults.playlist;
      if (playlistData) {
        const playlistItems = playlistData.contents.reduce<ContentItem.Video[]>((items, itemData) => {
          const parsedItem = this.#parseContentItem(itemData);
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
        const playlistAuthor = this.#parseAuthor(playlistData.author);
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
      const itemSection = twoColumnWatchNextResults.secondary_results.firstOfType(YTNodes.ItemSection);
      const relatedItemList = itemSection ? itemSection.contents : twoColumnWatchNextResults.secondary_results;
      if (relatedItemList) {
        const parsedItems = relatedItemList.map((item) => this.#parseContentItem(item));
        result.related = {
          items: parsedItems.filter((item) => item?.type === 'video' || item?.type === 'playlist') as (ContentItem.Video | ContentItem.Playlist)[]
        };
        const continuationItem = relatedItemList.find((item) => item.type === 'ContinuationItem') as YTNodes.ContinuationItem;
        const parsedContinuation = this.#parseContinuationItem(continuationItem);
        if (parsedContinuation && parsedContinuation.endpoint.type === EndpointType.WatchContinuation) {
          result.related.continuation = parsedContinuation as Continuation<typeof parsedContinuation.endpoint.type>;
        }
      }

      return result;
    }

    return null;
  }

  static #parseSearchEndpointResult(data: ISearchResponse): PageContent | null {
    const dataContents = this.unwrap(data.contents);
    if (!dataContents) {
      return null;
    }

    if (!Array.isArray(dataContents) && dataContents.type === 'TwoColumnSearchResults') {
      const twoColumnSearchResults = dataContents as YTNodes.TwoColumnSearchResults;
      return this.#parseBrowseEndpointResult({ contents: twoColumnSearchResults.primary_contents });
    }

    return null;
  }

  static #parseBrowseEndpointResult(data: Partial<IBrowseResponse & ISearchResponse>): PageContent | null {

    const itemContinuations = data.on_response_received_actions ||
          data.on_response_received_endpoints ||
          data.on_response_received_commands || null;

    if (itemContinuations && itemContinuations.length > 0) {
      const actionOrCommands = itemContinuations.filter((c) =>
        c.type === 'appendContinuationItemsAction' ||
        c.type === 'reloadContinuationItemsCommand');
      if (actionOrCommands) {
        const sections = actionOrCommands.reduce<PageElement.Section[]>((sections, ac) => {
          const parsedSection = this.#parseContentToSection({ content: this.unwrap(ac.contents) } as SectionContent);
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

    const result: PageContent = {
      type: 'page',
      isContinuation: false,
      sections: []
    };

    if (data.header) {
      const dataHeader = this.unwrap(data.header);
      if (dataHeader && !Array.isArray(dataHeader)) {
        const header = this.#parseHeader(dataHeader);
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
          const parsedSection = this.#parseContentToSection(selectedTab.content);
          if (parsedSection) {
            result.sections.push(parsedSection);
          }
        }
      }
    }
    else {
      const parsedSection = this.#parseContentToSection({ content: dataContents } as SectionContent);
      if (parsedSection) {
        result.sections.push(parsedSection);
      }
    }

    return result;
  }

  static #parseHeader(data: YTHelpers.YTNode): PageElement.Header | PageElement.PlaylistHeader | null {
    if (!data) {
      return null;
    }

    let type: PageElement.Header['type'] | null = null,
      title: string | null = null,
      subtitles: string[] = [],
      description: string| null = null,
      thumbnail: string | null = null,
      endpoint: Endpoint | null = null,
      author: ContentItem.Author | null = null,
      shufflePlay: ContentItem.EndpointLink | null = null;

    if (data.type === 'FeedTabbedHeader') {
      type = 'feed';
      const fthData = data as YTNodes.FeedTabbedHeader;
      title = this.unwrap(fthData.title);
    }
    // Channel
    else if (data.type === 'C4TabbedHeader') {
      type = 'channel';
      const c4thData = data as YTNodes.C4TabbedHeader;
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
      const ithData = data as YTNodes.InteractiveTabbedHeader;
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
      const plData = data as YTNodes.PlaylistHeader;
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
      author = this.#parseAuthor(plData.author);
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
      const chData = data as YTNodes.CarouselHeader;
      const details = chData.contents.find((header) => header.type === 'TopicChannelDetails');
      if (details) {
        const tcdData = details as YTNodes.TopicChannelDetails;
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
      const result: PageElement.Header = {
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
          (result as PageElement.PlaylistHeader).author = author;
        }
        if (shufflePlay) {
          (result as PageElement.PlaylistHeader).shufflePlay = shufflePlay;
        }
      }

      return result;
    }

    return null;
  }

  /**
   * Parses header and contents of `data` and returns an object with simplified data structure.
   * `data` can be from:
   * - Tab
   * - SectionList
   * - ItemSection,
   * - Shelf
   * - HorizontalList
   * - Grid
   * - PlaylistVideoList
   * - RichSection
   * - HorizontalCardList
   * - HorizontalMovieList
   * - VerticalList
   * - GuideSection,
   * - GuideSubscriptionsSection
   * Contents of `data` can contain nested sections (e.g. Tab contents can contain
   * ItemSections which in turn contain Shelfs, as opposed to an array of media items).
   * When this happens, the function will call itself and add the result with type `section` to the `items` array.
   * @param {*} data
   * @returns Object with simplified data structure, or `null` if the resulting structure is empty.
   */
  static #parseContentToSection(data?: SectionContent | null): PageElement.Section | null {
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

    const section: PageElement.Section = {
      type: 'section',
      items: []
    };

    const __parseContentItem = (contentItem: NestedSection | YTHelpers.YTNode | YTNodes.ContinuationItem) => {
      if (nestedSectionTypes.includes(contentItem.type)) {
        // Nested section
        const parsedNested = this.#parseContentToSection(contentItem as NestedSection);
        if (parsedNested) {
          section.items.push(parsedNested);
        }
      }
      else if (contentItem.type === 'ContinuationItem') {
        const continuationItem = this.#parseContinuationItem(contentItem as YTNodes.ContinuationItem);
        if (continuationItem && (continuationItem.endpoint.type === EndpointType.BrowseContinuation ||
          continuationItem.endpoint.type === EndpointType.SearchContinuation)) {
          section.continuation = continuationItem as Continuation<typeof continuationItem.endpoint.type>;
        }
      }
      else {
        const mediaItem = this.#parseContentItem(contentItem as YTHelpers.YTNode);
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
    const sectionFilters: PageElement.Option[] = [];

    // FeedFilterChipBar
    if (dataHeader?.type === 'FeedFilterChipBar') {
      const chips = (dataHeader as unknown as YTNodes.FeedFilterChipBar).contents;
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
      const ssmData = data.sub_menu as YTNodes.SearchSubMenu;
      const searchFilters = ssmData.groups?.reduce<PageElement.Option[]>((filters, group) => {
        const title = this.unwrap(group.title);
        const optionValues = group.filters?.filter((f) => !f.disabled)
          .reduce<PageElement.Option['optionValues']>((result, f) => {
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
    const sectionMenus: PageElement.Option[] = [];

    // SectionList.ChannelSubMenu
    if (data.sub_menu?.type === 'ChannelSubMenu') {
      const cssData = data.sub_menu as YTNodes.ChannelSubMenu;
      const contentTypeMenu: PageElement.Option = {
        type: 'option',
        optionValues: cssData.content_type_sub_menu_items.reduce<PageElement.Option['optionValues']>(
          (result, item) => {
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

      const sortSetting = cssData.sort_setting as YTNodes.SortFilterSubMenu; // SortFilterSubMenu
      if (sortSetting && sortSetting.sub_menu_items) {
        const sortFilterMenu: PageElement.Option = {
          type: 'option',
          title: sortSetting.title,
          optionValues: sortSetting.sub_menu_items.reduce<PageElement.Option['optionValues']>(
            (result, item) => {
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
    const sectionButtons: PageElement.Button[] = [];

    let topLevelButtons: any = null;
    if (data.menu?.hasKey('top_level_buttons')) {
      topLevelButtons = data.menu.top_level_buttons;
    }
    if (Array.isArray(topLevelButtons)) { // E.g. 'See All' button in Library
      for (const button of topLevelButtons.filter((button) => !button.is_disabled)) {
        const parsedButton = this.#parseButton(button);
        if (parsedButton) {
          sectionButtons.push(parsedButton);
        }
      }
    }

    // PlayAllButton (e.g. in Channel -> Shelf)
    if (data.play_all_button) {
      const parsedButton = this.#parseButton(data.play_all_button);
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
  }

  static #parseContentItem(data?: YTHelpers.YTNode | null): SectionItem | null {
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
        const vData = data as YTNodes.Video &
                              YTNodes.CompactVideo &
                              YTNodes.VideoCard &
                              YTNodes.GridVideo &
                              YTNodes.PlaylistVideo &
                              YTNodes.ReelItem &
                              YTNodes.PlaylistPanelVideo &
                              YTNodes.GridMovie;
        return {
          type: 'video',
          videoId: vData.id || vData.video_id,
          title: this.unwrap(vData.title),
          author: this.#parseAuthor(vData.author),
          thumbnail: this.parseThumbnail(vData.thumbnails || vData.thumbnail) || null,
          viewCount: this.unwrap(vData.view_count) || this.unwrap(vData.views),
          published: this.unwrap(vData.published),
          duration: this.#parseDuration(vData.duration),
          endpoint: this.parseEndpoint(vData.endpoint)
        } as ContentItem.Video;

      case 'CompactStation': // Masquerade as playlist
        const csData = data as YTNodes.CompactStation;
        return {
          type: 'playlist',
          title: this.unwrap(csData.title),
          thumbnail: this.parseThumbnail(csData.thumbnail),
          videoCount: this.unwrap(csData.video_count),
          endpoint: this.parseEndpoint(csData.endpoint) // Watch endpoint
        } as ContentItem.Playlist;

      case 'GameCard':
        const gcData = data as YTNodes.GameCard;
        const gameData = gcData.game.type === 'GameDetails' ? gcData.game as YTNodes.GameDetails : null;
        if (gameData) {
          return {
            type: 'channel',
            name: this.unwrap(gameData.title),
            channelId: gameData.endpoint.payload.browseId,
            thumbnail: this.parseThumbnail(gameData.box_art) || null,
            endpoint: this.parseEndpoint(gameData.endpoint)
          } as ContentItem.Channel;
        }
        return null;

      case 'Playlist':
      case 'GridPlaylist':
      case 'Mix':
      case 'GridMix':
      case 'CompactMix':
        const plData = data as YTNodes.Playlist &
                               YTNodes.GridPlaylist &
                               YTNodes.Mix &
                               YTNodes.GridMix &
                               YTNodes.CompactMix;
        const playlistItem = {
          type: 'playlist',
          playlistId: plData.id,
          title: this.unwrap(plData.title),
          thumbnail: this.parseThumbnail(plData.thumbnails) || null,
          author: this.#parseAuthor(plData.author),
          videoCount: this.unwrap(plData.video_count),
          endpoint: this.parseEndpoint(plData.endpoint), // Watch endpoint
          isMix: data.type.includes('Mix')
        } as ContentItem.Playlist;

        const plBrowseEndpoint = this.parseEndpoint(plData.view_playlist?.endpoint);
        if (plBrowseEndpoint) { // Browse endpoint for GridPlaylist
          playlistItem.browseEndpoint = plBrowseEndpoint;
        }

        return playlistItem;

      case 'Channel':
      case 'GridChannel':
        const chData = data as YTNodes.Channel & YTNodes.GridChannel;
        const dataAuthor = this.#parseAuthor(chData.author);
        if (dataAuthor) {
          const result = {
            type: 'channel',
            channelId: chData.id,
            name: dataAuthor.name,
            thumbnail: dataAuthor.thumbnail,
            subscribers: this.unwrap(chData.subscribers),
            endpoint: this.parseEndpoint(chData.endpoint)
          } as ContentItem.Channel;

          return result;
        }
        return null;

      case 'GuideEntry':
        const geData = data as YTNodes.GuideEntry;
        return {
          type: 'guideEntry',
          title: this.unwrap(geData.title),
          thumbnail: this.parseThumbnail(geData.thumbnails),
          icon: geData.icon_type,
          endpoint: this.parseEndpoint(geData.endpoint),
          isPrimary: geData.is_primary
        } as ContentItem.GuideEntry;

      case 'RichItem':
        const riData = data as YTNodes.RichItem;
        return this.#parseContentItem(riData.content);

      case 'ShowingResultsFor':
        const srfData = data as YTNodes.ShowingResultsFor;
        const showResultsForText = `${this.unwrap(srfData.showing_results_for)} ${this.unwrap(srfData.corrected_query)
        }&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.unwrap(srfData.search_instead_for)} ${this.unwrap(srfData.original_query)}`;
        return {
          type: 'endpointLink',
          title: showResultsForText,
          icon: 'YT2_SHOWING_RESULTS_FOR', // Our own icon type to be used as a hint of what this endpoint is about
          endpoint: this.parseEndpoint(srfData.original_query_endpoint)
        } as ContentItem.EndpointLink;

      default:
        return null;
    }
  }

  static #parseAuthor(data: YTMisc.Text | YTMisc.Author): ContentItem.Author | null {
    if (!data) {
      return null;
    }

    if (typeof data === 'string' || data instanceof YTMisc.Text) {
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
  }

  static #parseDuration(data?: YTMisc.Text | string | { seconds: number }): number | null {
    if (!data) {
      return null;
    }

    if (data instanceof YTMisc.Text) {
      const s = this.unwrap(data);
      if (s) {
        return YTUtils.timeToSeconds(s);
      }
    }
    else if (typeof data === 'object' && data.seconds) {
      return data.seconds;
    }

    if (typeof data === 'string') {
      return YTUtils.timeToSeconds(data);
    }

    return null;
  }

  static #parseContinuationItem(data: YTNodes.ContinuationItem) {
    if (!data) {
      return null;
    }
    const endpoint = this.parseEndpoint(data.endpoint);
    if (!endpoint || (endpoint.type !== EndpointType.BrowseContinuation &&
      endpoint.type !== EndpointType.SearchContinuation && endpoint.type !== EndpointType.WatchContinuation)) {
      return null;
    }

    const result: PageElement.Continuation<typeof endpoint.type> = {
      type: 'continuation',
      endpoint: { ...endpoint, type: endpoint.type }
    };

    if (data.button?.hasKey('text')) {
      result.text = this.unwrap(data.button.text);
    }

    return result;
  }

  static #parseButton(data?: YTNodes.Button): PageElement.Button | null {
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
  }

  static unwrap(data?: string | YTMisc.Text): string;
  static unwrap(data?: YTHelpers.SuperParsedResult<YTHelpers.YTNode> | null): YTHelpers.ObservedArray<YTHelpers.YTNode> | YTHelpers.YTNode | null;
  static unwrap<T>(data?: T): T | null;
  static unwrap(data?: any) {
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
    else if (typeof data === 'string' || data instanceof YTMisc.Text) {
      const s = (typeof data === 'string') ? data : data.toString();
      return (s === 'N/A' || s === '') ? null : s;
    }

    return data;
  }

  static parseThumbnail(data?: YTMisc.Thumbnail[]): string | null {
    const url = data?.[0]?.url;
    if (url?.startsWith('//')) {
      return `https:${url}`;
    }
    return url || null;
  }

  static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): Endpoint | null {
    if (!data) {
      return null;
    }

    const createPayload = (fields: string[], payloadData?: Record<string, any>) => {
      const payload: Record<string, any> = {};
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
            type: EndpointType.BrowseContinuation,
            payload: {
              token: data.payload.token
            }
          };
        }
        return {
          type: EndpointType.Browse,
          payload: createPayload([ 'browseId', 'params' ])
        };

      case '/search':
      case 'search':
        if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_SEARCH') {
          return {
            type: EndpointType.SearchContinuation,
            payload: {
              token: data.payload.token
            }
          };
        }
        return {
          type: EndpointType.Search,
          payload: createPayload([ 'query', 'params' ])
        };

      case '/player':
        return {
          type: EndpointType.Watch,
          payload: createPayload([ 'videoId', 'playlistId', 'params', 'index' ])
        };

      case 'next':
        if (data?.payload?.request === 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT') {
          return {
            type: EndpointType.WatchContinuation,
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
        type: EndpointType.Watch,
        payload: createPayload([ 'videoId' ])
      };
    }

    return null;
  }
}
