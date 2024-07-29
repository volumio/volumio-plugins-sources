import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Utils as YTUtils, Helpers as YTHelpers, IParsedResponse } from 'volumio-youtubei.js';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointOf, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../types/Endpoint';
import { ContentItem, PageElement } from '../types';
import { SectionItem } from '../types/PageElement';
import { ContentOf, PageContent, WatchContent, WatchContinuationContent } from '../types/Content';
import EndpointHelper from '../util/EndpointHelper';

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

  static parseResult(data: ParseableInnertubeResponse | { contents: any }): ContentOf<BrowseEndpoint> | null;
  static parseResult<T extends Endpoint>(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpoint: T): ContentOf<T> | null;
  static parseResult<T extends Endpoint>(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpoint?: T): ContentOf<T> | null {

    switch (originatingEndpoint?.type || EndpointType.Browse) {
      case EndpointType.Watch:
        return this.#parseWatchEndpointResult(data as INextResponse) as ContentOf<T & WatchEndpoint>;

      case EndpointType.WatchContinuation:
        return this.#parseWatchContinuationEndpointResult(data as IParsedResponse) as ContentOf<T & WatchContinuationEndpoint>;

      case EndpointType.Search:
        return this.#parseSearchEndpointResult(data as ISearchResponse) as ContentOf<T & SearchEndpoint>;

      case EndpointType.Browse:
      case EndpointType.BrowseContinuation:
      case EndpointType.SearchContinuation:
        return this.#parseBrowseEndpointResult(data as IBrowseResponse) as ContentOf<T & BrowseEndpoint>;

      default:
        return null;
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
        const continuationItem = acItems.find((item) => item instanceof YTNodes.ContinuationItem) as YTNodes.ContinuationItem;
        const parsedContinuation = this.#parseContinuationItem(continuationItem, EndpointType.WatchContinuation);
        if (parsedContinuation) {
          watchContinuationContent.continuation = parsedContinuation;
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

    if (dataContents instanceof YTNodes.TwoColumnWatchNextResults) {
      // Playlist items
      const playlistData = dataContents.playlist;
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
      const autoplayEndpoint = this.parseEndpoint(dataContents.autoplay?.sets[0].autoplay_video, EndpointType.Watch);
      if (autoplayEndpoint) {
        result.autoplay = autoplayEndpoint;
      }

      // Related
      // - If user is signed out, related items appear directly under secondary_results
      // - If user is signed in, related items appear in ItemSection under secondary_results
      const itemSection = dataContents.secondary_results.firstOfType(YTNodes.ItemSection);
      const relatedItemList = itemSection ? itemSection.contents : dataContents.secondary_results;
      if (relatedItemList) {
        const parsedItems = relatedItemList.map((item) => this.#parseContentItem(item));
        result.related = {
          items: parsedItems.filter((item) => item?.type === 'video' || item?.type === 'playlist') as (ContentItem.Video | ContentItem.Playlist)[]
        };
        const continuationItem = relatedItemList.find((item) => item instanceof YTNodes.ContinuationItem) as YTNodes.ContinuationItem;
        const parsedContinuation = this.#parseContinuationItem(continuationItem, EndpointType.WatchContinuation);
        if (parsedContinuation) {
          result.related.continuation = parsedContinuation;
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

    if (dataContents instanceof YTNodes.TwoColumnSearchResults) {
      return this.#parseBrowseEndpointResult({ contents: dataContents.primary_contents });
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
        const metadata = this.unwrap(data.metadata);
        const header = this.#parseHeader(dataHeader, !Array.isArray(metadata) ? metadata : null);
        if (header) {
          result.header = header;
        }
      }
    }

    const dataContents = this.unwrap(data.contents);

    if (dataContents && !Array.isArray(dataContents) && dataContents.hasKey('tabs')) {
      const tabs = this.unwrap(dataContents.tabs);
      if (tabs && Array.isArray(tabs)) {
        const reducedTabs = tabs.filter((tab) => !(tab.type instanceof YTNodes.ExpandableTab))
          .reduce((filtered, tab) => {
            const tabEndpoint = this.parseEndpoint(tab.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation,
              EndpointType.Search, EndpointType.SearchContinuation);
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

  static #parseHeader(data: YTHelpers.YTNode, metadata?: YTHelpers.YTNode | null): PageElement.Header | PageElement.PlaylistHeader | null {
    if (!data) {
      return null;
    }

    let type: PageElement.Header['type'] | null = null,
      title: string | null = null,
      subtitles: string[] = [],
      description: string| null = null,
      thumbnail: string | null = null,
      endpoint: BrowseEndpoint | WatchEndpoint | null = null,
      author: ContentItem.Author | null = null,
      shufflePlay: ContentItem.EndpointLink | null = null;

    if (data instanceof YTNodes.FeedTabbedHeader) {
      type = 'feed';
      title = this.unwrap(data.title);
    }
    // Channel
    else if (data instanceof YTNodes.C4TabbedHeader) {
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

      endpoint = this.parseEndpoint(data.author?.endpoint, EndpointType.Browse);
    }
    // E.g. Gaming channel
    else if (data instanceof YTNodes.InteractiveTabbedHeader) {
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
    else if (data instanceof YTNodes.PlaylistHeader) {
      type = 'playlist';
      title = this.unwrap(data.title);
      if (data.stats) {
        subtitles = data.stats.reduce<string[]>((result, stat) => {
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
        endpoint = this.parseEndpoint(data.banner.on_tap_endpoint, EndpointType.Watch);
      }
      author = this.#parseAuthor(data.author);
      const shufflePlayButton = this.unwrap(data.shuffle_play_button);
      if (shufflePlayButton && !Array.isArray(shufflePlayButton) && shufflePlayButton.hasKey('endpoint') && shufflePlayButton.hasKey('text')) {
        const shufflePlayEndpoint = this.parseEndpoint(shufflePlayButton?.endpoint, EndpointType.Watch);
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
    else if (data instanceof YTNodes.CarouselHeader) {
      const details = data.contents.find((header) => header instanceof YTNodes.TopicChannelDetails) as YTNodes.TopicChannelDetails;
      if (details) {
        type = 'channel';
        title = this.unwrap(details.title);
        thumbnail = this.parseThumbnail(details.avatar);
        endpoint = this.parseEndpoint(details.endpoint, EndpointType.Browse);

        const detailsSubtitle = this.unwrap(details.subtitle);
        if (detailsSubtitle) {
          subtitles.push(detailsSubtitle);
        }
      }
    }
    // Generic PageHeader - need to check if 'channel' type
    else if (data instanceof YTNodes.PageHeader && metadata instanceof YTNodes.ChannelMetadata) {
      type = 'channel';
      title = this.unwrap(data.content?.title?.text);
      description = metadata.description;
      thumbnail = this.parseThumbnail(metadata.avatar);
      if (data.content?.metadata?.metadata_rows) {
        for (const row of data.content?.metadata?.metadata_rows || []) {
          const parts = row.metadata_parts?.reduce<string[]>((result, { text }) => {
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
          type: EndpointType.Browse,
          payload: {
            browseId: metadata.external_id
          }
        };
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
      else if (contentItem instanceof YTNodes.ContinuationItem) {
        const continuationItem = this.#parseContinuationItem(contentItem, EndpointType.BrowseContinuation, EndpointType.SearchContinuation);
        if (continuationItem) {
          section.continuation = continuationItem;
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
    if (dataHeader instanceof YTNodes.FeedFilterChipBar) {
      const chips = dataHeader.contents;
      /**
       * Note that, unlike other 'option.optionValues' type arrays, we don't
       * validate endpoint for FeedFilterChipBar. This is because the selected
       * chip does actually not provide an endpoint, but we don't want to
       * exclude it from the filters.
       */
      const dataFilters = chips.map((chip) => {
        const endpoint = this.parseEndpoint(chip.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation,
          EndpointType.Search, EndpointType.SearchContinuation);
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
    if (data.sub_menu instanceof YTNodes.SearchSubMenu) {
      // One filter per group
      const searchFilters = data.sub_menu.groups.reduce<PageElement.Option[]>((filters, group) => {
        const title = this.unwrap(group.title);
        if (title) {
          const optionValues = group.filters?.filter((f) => !f.disabled)
            .reduce<PageElement.Option['optionValues']>((result, f) => {
              const endpoint = this.parseEndpoint(f.endpoint, EndpointType.Search, EndpointType.SearchContinuation);
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
    const dataEndpoint = this.parseEndpoint(data.endpoint,
      EndpointType.Browse, EndpointType.BrowseContinuation, EndpointType.Search, EndpointType.SearchContinuation);
    if (dataTitle) {
      section.title = dataTitle;
    }
    if (dataEndpoint) {
      section.endpoint = dataEndpoint;
    }

    // Menus
    const sectionMenus: PageElement.Option[] = [];

    // SectionList.ChannelSubMenu
    if (data.sub_menu instanceof YTNodes.ChannelSubMenu) {
      const contentTypeMenu: PageElement.Option = {
        type: 'option',
        optionValues: data.sub_menu.content_type_sub_menu_items.reduce<PageElement.Option['optionValues']>(
          (result, item) => {
            const endpoint = this.parseEndpoint(item.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation);
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
      if (sortSetting instanceof YTNodes.SortFilterSubMenu && sortSetting.sub_menu_items) {
        const sortFilterMenu: PageElement.Option = {
          type: 'option',
          title: sortSetting.title,
          optionValues: sortSetting.sub_menu_items.reduce<PageElement.Option['optionValues']>(
            (result, item) => {
              const endpoint = this.parseEndpoint(item.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation);
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
        const vDataTitle = this.unwrap(vData.title);
        const vDataEndpoint = this.parseEndpoint(vData.endpoint, EndpointType.Watch);
        if (vDataTitle && vDataEndpoint) {
          const vidResult: ContentItem.Video = {
            type: 'video',
            videoId: vData.id || vData.video_id,
            title: vDataTitle,
            author: this.#parseAuthor(vData.author) || undefined,
            thumbnail: this.parseThumbnail(vData.thumbnails || vData.thumbnail) || undefined,
            viewCount: this.unwrap(vData.view_count) || this.unwrap(vData.views) || undefined,
            published: this.unwrap(vData.published) || undefined,
            duration: this.#parseDuration(vData.duration) || undefined,
            endpoint: vDataEndpoint
          };
          return vidResult;
        }
        return null;

      case 'CompactStation': // Masquerade as playlist
        const csData = data as YTNodes.CompactStation;
        const csDataTitle = this.unwrap(csData.title);
        const csDataEndpoint = this.parseEndpoint(csData.endpoint, EndpointType.Watch);
        if (csDataTitle && csDataEndpoint) {
          const plResult: ContentItem.Playlist = {
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
        const gcData = data as YTNodes.GameCard;
        if (gcData.game instanceof YTNodes.GameDetails) {
          const gcDataName = this.unwrap(gcData.game.title);
          const gcDataEndpoint = this.parseEndpoint(gcData.game.endpoint, EndpointType.Browse);
          if (gcDataName && gcDataEndpoint) {
            const gcResult: ContentItem.Channel = {
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
        const plData = data as YTNodes.Playlist &
                               YTNodes.GridPlaylist &
                               YTNodes.Mix &
                               YTNodes.GridMix &
                               YTNodes.CompactMix;
        const plDataTitle = this.unwrap(plData.title);
        const plDataEndpoint = this.parseEndpoint(plData.endpoint, EndpointType.Watch);
        if (plDataTitle && plDataEndpoint) {
          const playlistItem: ContentItem.Playlist = {
            type: 'playlist',
            playlistId: plData.id,
            title: plDataTitle,
            thumbnail: this.parseThumbnail(plData.thumbnails) || undefined,
            author: this.#parseAuthor(plData.author) || undefined,
            videoCount: this.unwrap(plData.video_count) || undefined,
            endpoint: plDataEndpoint,
            isMix: data.type.includes('Mix')
          };

          const plBrowseEndpoint = this.parseEndpoint(plData.view_playlist?.endpoint, EndpointType.Browse);
          if (plBrowseEndpoint) { // Browse endpoint for GridPlaylist
            playlistItem.browseEndpoint = plBrowseEndpoint;
          }

          return playlistItem;
        }
        return null;

      case 'Channel':
      case 'GridChannel':
        const chData = data as YTNodes.Channel & YTNodes.GridChannel;
        const dataAuthor = this.#parseAuthor(chData.author);
        const chDataEndpoint = this.parseEndpoint(chData.endpoint, EndpointType.Browse);
        if (dataAuthor && chDataEndpoint) {
          const chResult: ContentItem.Channel = {
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
        const geData = data as YTNodes.GuideEntry;
        const geDataTitle = this.unwrap(geData.title);
        const geDataEndpoint = this.parseEndpoint(geData.endpoint, EndpointType.Browse);
        if (geDataTitle && geDataEndpoint) {
          const geResult: ContentItem.GuideEntry = {
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
        const riData = data as YTNodes.RichItem;
        return this.#parseContentItem(riData.content);

      case 'ShowingResultsFor':
        const srfData = data as YTNodes.ShowingResultsFor;
        const srfDataEndpoint = this.parseEndpoint(srfData.original_query_endpoint, EndpointType.Search);
        const showResultsForText = `${this.unwrap(srfData.showing_results_for)} ${this.unwrap(srfData.corrected_query)
        }&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.unwrap(srfData.search_instead_for)} ${this.unwrap(srfData.original_query)}`;
        if (srfDataEndpoint) {
          const srResult: ContentItem.EndpointLink = {
            type: 'endpointLink',
            title: showResultsForText,
            icon: 'YT2_SHOWING_RESULTS_FOR', // Our own icon type to be used as a hint of what this endpoint is about
            endpoint: srfDataEndpoint
          };
          return srResult;
        }
        return null;

      default:
        return null;
    }
  }

  static #parseAuthor(data: YTMisc.Text | YTMisc.Author): ContentItem.Author | null {
    if (!data) {
      return null;
    }

    if (typeof data === 'string') {
      return {
        name: data
      };
    }

    if (data instanceof YTMisc.Text) {
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
        endpoint: this.parseEndpoint(data.endpoint, EndpointType.Browse)
      };
    }

    return null;
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

  static #parseContinuationItem<T extends EndpointType.BrowseContinuation |
    EndpointType.SearchContinuation | EndpointType.WatchContinuation>(data: YTNodes.ContinuationItem, ...requireType: T[]) {

    if (!data) {
      return null;
    }

    const endpoint = this.parseEndpoint(data.endpoint, ...requireType);

    if (!endpoint) {
      return null;
    }

    const result: PageElement.Continuation<T> = {
      type: 'continuation',
      endpoint
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

    const buttonEndpoint = this.parseEndpoint(data.endpoint, EndpointType.Browse,
      EndpointType.BrowseContinuation, EndpointType.Search, EndpointType.SearchContinuation, EndpointType.Watch);
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

  static unwrap(data?: string | YTMisc.Text): string | null;
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

  static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): BrowseEndpoint |
    BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
  static parseEndpoint<K extends EndpointType[]>(data?: YTNodes.NavigationEndpoint | null, ...requireTypes: K): EndpointOf<K[number]> | null;
  static parseEndpoint<K extends EndpointType[]>(data?: YTNodes.NavigationEndpoint | null, ...requireTypes: K) {
    if (!data) {
      return null;
    }

    const __checkType = (endpoint: Endpoint | null) => {
      if (!endpoint) {
        return null;
      }

      if (requireTypes.length === 0) {
        return endpoint;
      }

      return EndpointHelper.isType(endpoint, ...requireTypes) ? endpoint as EndpointOf<K[number]> : null;
    };

    const __createPayload = <V extends Endpoint>(fields: (keyof V['payload'])[], payloadData?: Record<string, any>) => {
      const payload: V['payload'] = {};
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
          const result: BrowseContinuationEndpoint = {
            type: EndpointType.BrowseContinuation,
            payload: {
              token: data.payload.token
            }
          };
          return __checkType(result);
        }
        const beResult: BrowseEndpoint = {
          type: EndpointType.Browse,
          payload: __createPayload<BrowseEndpoint>([ 'browseId', 'params' ])
        };
        return __checkType(beResult);

      case '/search':
      case 'search':
        if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_SEARCH') {
          const result: SearchContinuationEndpoint = {
            type: EndpointType.SearchContinuation,
            payload: {
              token: data.payload.token
            }
          };
          return __checkType(result);
        }
        const seResult: SearchEndpoint = {
          type: EndpointType.Search,
          payload: __createPayload<SearchEndpoint>([ 'query', 'params' ])
        };
        return __checkType(seResult);

      case '/player':
        const weResult: WatchEndpoint = {
          type: EndpointType.Watch,
          payload: __createPayload<WatchEndpoint>([ 'videoId', 'playlistId', 'params', 'index' ])
        };
        return __checkType(weResult);

      case '/next':
      case 'next':
        if (data?.payload?.request === 'CONTINUATION_REQUEST_TYPE_WATCH_NEXT') {
          const result: WatchContinuationEndpoint = {
            type: EndpointType.WatchContinuation,
            payload: {
              token: data.payload.token
            }
          };
          return __checkType(result);
        }
        if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_WATCH') {
          const weResult: WatchEndpoint = {
            type: EndpointType.Watch,
            payload: __createPayload<WatchEndpoint>([ 'videoId', 'playlistId', 'params', 'index' ])
          };
          return __checkType(weResult);
        }
        break;

      default:
    }

    if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_SHORTS') {
      // For now, forget about sequence and treat reelWatchEndpoints
      // As normal watch endpoints
      const result: WatchEndpoint = {
        type: EndpointType.Watch,
        payload: __createPayload<WatchEndpoint>([ 'videoId' ])
      };
      return __checkType(result);
    }

    return null;
  }
}
