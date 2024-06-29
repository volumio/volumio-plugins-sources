import ytmusic, { I18nKey } from '../YTMusicContext';
import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Helpers as YTHelpers, IParsedResponse, PlaylistPanelContinuation, GridContinuation, MusicShelfContinuation, MusicPlaylistShelfContinuation, SectionListContinuation } from 'volumio-youtubei.js';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointOf, EndpointType, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../types/Endpoint';
import { ContentItem, PageElement } from '../types';
import { SectionItem } from '../types/PageElement';
import EndpointHelper from '../util/EndpointHelper';
import { ContentOf, PageContent, WatchContent, WatchContinuationContent } from '../types/Content';
import { TextRun } from 'volumio-youtubei.js/dist/src/parser/misc';
import { MetadataLyrics, MetadataSyncedLyrics } from 'now-playing-common';

type ParseableInnertubeResponse = INextResponse | ISearchResponse | IBrowseResponse | IParsedResponse;

type NestedSection = YTNodes.SectionList &
  YTNodes.ItemSection &
  YTNodes.Grid &
  YTNodes.MusicShelf &
  YTNodes.MusicCardShelf &
  YTNodes.MusicCarouselShelf &
  YTNodes.MusicPlaylistShelf;

type SectionContent = Partial<NestedSection |
  (NestedSection &
    YTNodes.Tab) &
  { contents?: any, header?: any, continuation?: string }>;

// Tab title refers to i18n key
const TAB_TITLE_BY_BROWSE_ID: Record<string, I18nKey> = {
  'FEmusic_home': 'YTMUSIC_HOME',
  'FEmusic_explore': 'YTMUSIC_EXPLORE',
  'FEmusic_library_landing': 'YTMUSIC_LIBRARY',
  'FEmusic_history': 'YTMUSIC_HISTORY'
};

export default class InnertubeResultParser {

  static parseResult<T extends Endpoint>(data: ParseableInnertubeResponse | { contents: any },
    originatingEndpoint: T): ContentOf<T> | null {

    switch (originatingEndpoint.type) {
      case EndpointType.Watch:
        return this.#parseWatchEndpointResult(data as INextResponse) as ContentOf<T & WatchEndpoint>;

      case EndpointType.WatchContinuation:
        return this.#parseWatchContinuationEndpointResult(data as IParsedResponse) as ContentOf<T & WatchContinuationEndpoint>;

      case EndpointType.Browse:
      case EndpointType.BrowseContinuation:
      case EndpointType.Search:
      case EndpointType.SearchContinuation:
        return this.#parseBrowseEndpointResult(data as IBrowseResponse, originatingEndpoint) as ContentOf<T & BrowseEndpoint>;

      default:
        return null;
    }
  }

  static #parseWatchContinuationEndpointResult(data: IParsedResponse): WatchContinuationContent | null {
    const continuationContents = data.continuation_contents;
    if (continuationContents instanceof PlaylistPanelContinuation) {
      if (continuationContents.contents) {
        const parsedItems = continuationContents.contents.reduce<WatchContinuationContent['items']>((result, item) => {
          const parsedItem = this.parseContentItem(item);
          if (parsedItem && (parsedItem.type === 'video' || parsedItem.type === 'song')) {
            result.push(parsedItem);
          }
          return result;
        }, []);

        const result: WatchContinuationContent = {
          type: 'watch',
          isContinuation: true,
          items: parsedItems
        };

        if (continuationContents.continuation) {
          const lastItemEndpointPayload = parsedItems[parsedItems.length - 1]?.endpoint?.payload;
          if (lastItemEndpointPayload) {
            const continuationEndpoint: WatchContinuationEndpoint = {
              type: EndpointType.WatchContinuation,
              payload: {
                token: continuationContents.continuation,
                playlistId: lastItemEndpointPayload.playlistId
              }
            };
            if (lastItemEndpointPayload.videoId) {
              continuationEndpoint.payload.videoId = lastItemEndpointPayload.videoId;
            }
            if (lastItemEndpointPayload?.params) {
              continuationEndpoint.payload.params = lastItemEndpointPayload.params;
            }
            if (lastItemEndpointPayload?.index !== undefined) {
              continuationEndpoint.payload.index = lastItemEndpointPayload.index;
            }
            if (lastItemEndpointPayload?.playlistSetVideoId) {
              continuationEndpoint.payload.playlistSetVideoId = lastItemEndpointPayload.playlistSetVideoId;
            }
            result.continuation = {
              type: 'continuation',
              endpoint: continuationEndpoint
            };
          }
        }

        return result;
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

    const playlistPanel = data.contents_memo?.getType(YTNodes.PlaylistPanel)?.first();

    if (playlistPanel) {
      let automix: ContentItem.Automix | null = null;
      // Playlist items
      const playlistItems = playlistPanel.contents.reduce<ContentItem.MusicItem[]>((items, itemData) => {
        const parsedItem = this.parseContentItem(itemData);
        if (parsedItem && (parsedItem.type === 'video' || parsedItem.type === 'song')) {
          items.push(parsedItem);
        }
        else if (parsedItem && parsedItem.type === 'automix') {
          automix = parsedItem;
        }
        return items;
      }, []);

      result.playlist = {
        type: 'playlist',
        playlistId: playlistPanel.playlist_id,
        title: playlistPanel.title,
        items: playlistItems
      };

      // Automix
      if (automix) {
        result.automix = automix;
      }

      // Continuation
      if (playlistPanel.continuation) {
        result.continuation = {
          type: 'continuation',
          endpoint: {
            type: EndpointType.WatchContinuation,
            payload: {
              token: playlistPanel.continuation,
              playlistId: result.playlist.playlistId
            }
          }
        };
        const lastItemEndpointPayload = playlistItems[playlistItems.length - 1]?.endpoint?.payload;
        if (lastItemEndpointPayload?.params) {
          result.continuation.endpoint.payload.params = lastItemEndpointPayload.params;
        }
        if (lastItemEndpointPayload?.index !== undefined) {
          result.continuation.endpoint.payload.index = lastItemEndpointPayload.index;
        }
        if (lastItemEndpointPayload?.playlistSetVideoId) {
          result.continuation.endpoint.payload.playlistSetVideoId = lastItemEndpointPayload.playlistSetVideoId;
        }
      }

      return result;
    }

    return null;
  }

  static #parseBrowseEndpointResult(data: Partial<IBrowseResponse & ISearchResponse>, originatingEndpoint: Endpoint): PageContent | null {
    if (data.continuation_contents &&
      (data.continuation_contents instanceof MusicShelfContinuation ||
        data.continuation_contents instanceof MusicPlaylistShelfContinuation ||
        data.continuation_contents instanceof GridContinuation ||
        data.continuation_contents instanceof SectionListContinuation)) {
      const continuation = !(data.continuation_contents instanceof SectionListContinuation) ?
        data.continuation_contents.continuation : undefined;
      const parseData: SectionContent = {
        contents: data.continuation_contents.contents,
        continuation
      };
      if (data.continuation_contents instanceof SectionListContinuation && data.continuation_contents.header) {
        parseData.header = data.continuation_contents.header;
      }
      const section = this.#parseContentToSection(parseData, originatingEndpoint.type);
      const isReload = EndpointHelper.isType(originatingEndpoint, EndpointType.BrowseContinuation) ? !!originatingEndpoint.isReloadContinuation : false;
      if (section) {
        return {
          type: 'page',
          isContinuation: true,
          isReload,
          sections: [ section ]
        };
      }
      return null;
    }

    const result: PageContent = {
      type: 'page',
      isContinuation: false,
      isReload: false,
      sections: []
    };

    if (data.header) {
      const dataHeader = this.unwrap(data.header);
      if (dataHeader && !Array.isArray(dataHeader)) {
        const header = this.#parseHeader(dataHeader, originatingEndpoint);
        if (header) {
          result.header = header;
        }
      }
    }

    const dataContents = this.unwrap(data.contents);

    if (dataContents && !Array.isArray(dataContents) && dataContents.hasKey('tabs')) {
      const tabs = this.unwrap(dataContents.tabs);
      if (tabs && Array.isArray(tabs)) {
        if (!result.header) {
          // Album / Playlist has MusicResponsiveHeader wrapped in 'content'
          const hiddenHeader = this.#findNodesByType(tabs, YTNodes.MusicResponsiveHeader)?.[0];
          if (hiddenHeader) {
            const header = this.#parseHeader(hiddenHeader, originatingEndpoint);
            if (header) {
              result.header = header;
            }
          }
        }
        const reducedTabs = tabs.reduce<PageElement.Tab[]>((result, tab) => {
          const endpoint = this.parseEndpoint(tab.endpoint) || originatingEndpoint;
          let tabTitle = this.unwrap(tab.title);
          if (!tabTitle && EndpointHelper.isType(endpoint, EndpointType.Browse)) {
            const browseId = endpoint.payload.browseId;
            if (browseId && TAB_TITLE_BY_BROWSE_ID[browseId]) {
              tabTitle = ytmusic.getI18n(TAB_TITLE_BY_BROWSE_ID[browseId]);
            }
          }
          if (tabTitle && EndpointHelper.isType(endpoint,
            EndpointType.Browse, EndpointType.BrowseContinuation,
            EndpointType.Search, EndpointType.SearchContinuation)) {
            result.push({
              type: 'tab',
              text: tabTitle,
              endpoint,
              selected: !!tab.selected
            });
          }
          return result;
        }, []);

        if (reducedTabs.length > 0) {
          result.tabs = reducedTabs;
        }

        let selectedTab = tabs.find((tab) => tab.selected);
        if (!selectedTab && tabs.length === 1 && tabs[0].content) {
          selectedTab = tabs[0];
        }
        if (selectedTab) {
          const parsedSection = this.#parseContentToSection(selectedTab.content, originatingEndpoint.type);
          if (parsedSection) {
            result.sections.push(parsedSection);
          }
        }
      }
    }
    else {
      const parsedSection = this.#parseContentToSection({ contents: dataContents } as SectionContent, originatingEndpoint.type);
      if (parsedSection) {
        result.sections.push(parsedSection);
      }
    }

    if (dataContents && !Array.isArray(dataContents) && dataContents.hasKey('secondary_contents')) {
      const secondaryContents = this.unwrap(dataContents.secondary_contents);
      const parsedSection = this.#parseContentToSection({contents: secondaryContents} as SectionContent, originatingEndpoint.type);
      if (parsedSection) {
        result.sections.push(parsedSection);
      }
    }

    return result;
  }

  static #parseHeader(data: YTHelpers.YTNode, originatingEndpoint: Endpoint): PageElement.Header | PageElement.PlaylistHeader | null {
    if (!data) {
      return null;
    }

    // MusicEditablePlaylistDetailHeader
    // Occurs in playlists; wraps around actual header (MusicDetailHeader)
    if (data instanceof YTNodes.MusicEditablePlaylistDetailHeader) {
      return this.#parseHeader(data.header, originatingEndpoint);
    }

    let type: PageElement.Header['type'] | null = null,
      title: string | null = null,
      description: string | null = null,
      thumbnail: string | null = null,
      endpoint: WatchEndpoint | null = null,
      channel: ContentItem.Channel | null = null,
      shufflePlay: PageElement.PlaylistHeader['shufflePlay'] | null = null;
    const subtitles: string[] = [];

    // Artist
    if (data instanceof YTNodes.MusicImmersiveHeader) {
      type = 'channel';
      title = this.unwrap(data.title);
      description = this.unwrap(data.description);
      thumbnail = this.parseThumbnail(data.thumbnail?.contents);
      if (data.play_button) {
        const mihShufflePlayEndpoint = data.play_button.icon_type === 'MUSIC_SHUFFLE' ?
          this.parseEndpoint(data.play_button.endpoint, EndpointType.Watch) : null;
        if (mihShufflePlayEndpoint) {
          endpoint = mihShufflePlayEndpoint;
        }
      }
    }
    // Album / Playlist
    // -- Legacy: might remove in future - should now be MusicResponsiveHeader
    else if (data instanceof YTNodes.MusicDetailHeader) {
      title = this.unwrap(data.title);
      if (data.description) {
        description = this.unwrap(data.description);
      }
      if (data.author) {
        const endpoint = this.parseEndpoint(data.author.endpoint, EndpointType.Browse);
        channel = {
          type: 'channel',
          channelId: data.author.channel_id,
          name: data.author.name,
          endpoint
        };
      }
      const primarySubtitle = this.unwrap(data.subtitle);
      const secondSubtitle = this.unwrap(data.second_subtitle);
      if (primarySubtitle) {
        subtitles.push(primarySubtitle);
      }
      if (secondSubtitle) {
        subtitles.push(secondSubtitle);
      }
      thumbnail = this.parseThumbnail(data.thumbnails);
      const mdhMenu = this.unwrap(data.menu);
      if (mdhMenu instanceof YTNodes.Menu) {
        const mdhTopLevelButtons = mdhMenu.top_level_buttons.filter(
          (button) => button instanceof YTNodes.Button) as YTNodes.Button[];
        for (const button of mdhTopLevelButtons) {
          // We determine the header type here:
          // - Album has Play button in top level buttons
          // - Playlist has Shuffle Play button
          switch (button.icon_type) {
            case 'MUSIC_SHUFFLE':
              const mdhShufflePlayEndpoint = this.parseEndpoint(button.endpoint, EndpointType.Watch);
              const mdhShufflePlayText = this.unwrap(button.text);
              if (mdhShufflePlayEndpoint && mdhShufflePlayText) {
                type = 'playlist';
                shufflePlay = {
                  type: 'endpointLink',
                  title: mdhShufflePlayText,
                  endpoint: mdhShufflePlayEndpoint,
                  icon: button.icon_type
                };
                const playlistId = mdhShufflePlayEndpoint.payload.playlistId;
                if (playlistId) {
                  endpoint = {
                    type: EndpointType.Watch,
                    payload: {
                      playlistId
                    }
                  };
                }
              }
              break;

            case 'PLAY_ARROW':
              type = 'album';
              endpoint = this.parseEndpoint(button.endpoint, EndpointType.Watch);
              break;
          }
        }
      }
    }
    // Album / Playlist
    // -- Current (replaces MusicDetailHeader)
    else if (data instanceof YTNodes.MusicResponsiveHeader) {
      title = this.unwrap(data.title);
      if (data.description) {
        description = this.unwrap(data.description.description);
      }
      const textOne = data.strapline_text_one;
      const textOneStr = this.unwrap(textOne);
      const textOneEndpoint = textOne.endpoint;
      if (textOneEndpoint && textOneStr) {
        const authorTextRun = textOne.runs?.find((run) => {
          const runEndpoint = this.parseEndpoint((run as TextRun).endpoint, EndpointType.Browse);
          return EndpointHelper.isChannelEndpoint(runEndpoint);
        }) as TextRun;
        const authorEndpoint = authorTextRun.endpoint;
        const channelId = this.parseEndpoint(authorEndpoint, EndpointType.Browse)?.payload.browseId;
        if (channelId) {
          channel = {
            type: 'channel',
            channelId,
            name: textOneStr,
            endpoint
          };
        }
      }
      const primarySubtitle = this.unwrap(data.subtitle);
      const secondSubtitle = this.unwrap(data.second_subtitle);
      if (primarySubtitle) {
        subtitles.push(primarySubtitle);
      }
      if (secondSubtitle) {
        subtitles.push(secondSubtitle);
      }
      thumbnail = this.parseThumbnail(data.thumbnail?.contents);
      // Type
      type = EndpointHelper.isAlbumEndpoint(originatingEndpoint) ? 'album' : 'playlist';
      // Play endpoint
      const playButton = data.buttons.find((button) => button instanceof YTNodes.MusicPlayButton) as YTNodes.MusicPlayButton | undefined;
      if (playButton) {
        endpoint = this.parseEndpoint(playButton.endpoint, EndpointType.Watch);
      }
      // Shuffle endpoint
      const mdhMenu = data.buttons.find((button) => button instanceof YTNodes.Menu);
      if (mdhMenu instanceof YTNodes.Menu) {
        for (const menuItem of mdhMenu.items) {
          if (menuItem instanceof YTNodes.MenuNavigationItem && menuItem.icon_type === 'MUSIC_SHUFFLE') {
            const mdhShufflePlayEndpoint = this.parseEndpoint(menuItem.endpoint, EndpointType.Watch);
            const mdhShufflePlayText = this.unwrap(menuItem.text);
            if (mdhShufflePlayEndpoint && mdhShufflePlayText) {
              shufflePlay = {
                type: 'endpointLink',
                title: mdhShufflePlayText,
                endpoint: mdhShufflePlayEndpoint,
                icon: menuItem.icon_type
              };
            }
          }
        }
      }
    }
    // Generic - MusicHeader (e.g. Explore -> Charts)
    else if (data instanceof YTNodes.MusicHeader) {
      type = 'generic';
      title = this.unwrap(data.title);
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

      if (type === 'album' && channel) {
        const albumHeader = result as PageElement.AlbumHeader;
        albumHeader.artist = channel;
      }

      if (type === 'playlist') {
        const playlistHeader = result as PageElement.PlaylistHeader;
        if (channel) {
          playlistHeader.author = channel;
        }
        if (shufflePlay) {
          playlistHeader.shufflePlay = shufflePlay;
        }
      }
      return result;
    }

    return null;
  }

  static #parseContentToSection(data: SectionContent | null, originatingEndpointType: EndpointType): PageElement.Section | null {
    if (!data) {
      return null;
    }

    const nestedSectionTypes = [
      YTNodes.SectionList.type,
      YTNodes.ItemSection.type,
      YTNodes.Grid.type,
      YTNodes.MusicShelf.type,
      YTNodes.MusicCardShelf.type,
      YTNodes.MusicCarouselShelf.type,
      YTNodes.MusicPlaylistShelf.type
    ];

    const section: PageElement.Section = {
      type: 'section',
      items: []
    };

    if (data instanceof YTNodes.MusicPlaylistShelf) {
      section.playlistId = data.playlist_id;
    }

    const __parseContentItem = (contentItem: NestedSection | YTHelpers.YTNode) => {
      if (nestedSectionTypes.includes(contentItem.type)) {
        // Nested section
        const parsedNested = this.#parseContentToSection(contentItem as NestedSection, originatingEndpointType);
        if (parsedNested) {
          section.items.push(parsedNested);
        }
      }
      else {
        const parsedItem = this.parseContentItem(contentItem as YTHelpers.YTNode);
        if (parsedItem && parsedItem.type !== 'automix') {
          section.items.push(parsedItem);
        }
      }
    };

    const dataHeader = data.header;
    const dataContents = this.unwrap(data.contents) || this.unwrap(data.items);

    // Filters
    const sectionFilters: PageElement.Option[] = [];

    // -- filters from ChipCloud
    const dataHeaderChipClouds = this.#findNodesByType(dataHeader, YTNodes.ChipCloud);
    if (dataHeaderChipClouds.length > 0) {
      const dataContentChipCloudFilters = dataHeaderChipClouds.reduce<PageElement.Option[]>((result, chipCloud) => {
        const filter = this.#convertChipCloudToOption(chipCloud);
        if (filter) {
          result.push(filter);
        }
        return result;
      }, []);
      sectionFilters.push(...dataContentChipCloudFilters);
    }

    // -- filters from dropdowns
    // (`data.subheaders` present in MusicShelf)
    const dropdowns = this.#findNodesByType(
      data.subheaders ? [ dataHeader, data.subheaders ] : dataHeader, YTNodes.Dropdown);
    if (dropdowns.length > 0) {
      const dropdownFilters = dropdowns.reduce<PageElement.Option[]>((result, dropdown) => {
        const filter = this.#convertDropdownToOption(dropdown);
        if (filter) {
          result.push(filter);
        }
        return result;
      }, []);
      sectionFilters.push(...dropdownFilters);
    }

    // -- filters from MusicSortFilterButton
    const sortFilterButtons = this.#findNodesByType(
      data.subheaders ? [ dataHeader, data.subheaders ] : dataHeader, YTNodes.MusicSortFilterButton);
    if (sortFilterButtons.length > 0) {
      const sortFilters = sortFilterButtons.reduce<PageElement.Option[]>((result, button) => {
        const filter = this.#convertSortFilterButtonToOption(button);
        if (filter) {
          result.push(filter);
        }
        return result;
      }, []);
      sectionFilters.push(...sortFilters);
    }

    // Titles
    const dataTitle = this.unwrap(data.title || data.header?.title);
    const dataStrapline = this.unwrap(data.header?.strapline);
    if (dataTitle && dataStrapline) {
      section.title = dataStrapline;
      section.subtitle = dataTitle;
    }
    else if (dataTitle) {
      section.title = dataTitle;
    }
    else if (dataStrapline) {
      section.title = dataStrapline;
    }

    // Buttons
    const sectionButtons: PageElement.Button[] = [];

    // -- buttons from MusicCarouselShelfBasicHeader
    if (dataHeader instanceof YTNodes.MusicCarouselShelfBasicHeader) {
      if (dataHeader?.more_content) {
        const text = dataHeader.more_content.text;
        const endpoint = this.parseEndpoint(dataHeader.more_content.endpoint);
        if (text && endpoint) {
          sectionButtons.push({
            type: 'button',
            text,
            endpoint,
            placement: 'bottom'
          });
        }
      }
      else if (dataHeader?.end_icons?.[0]) {
        const icon = dataHeader.end_icons[0];
        const endpoint = this.parseEndpoint(icon.endpoint);
        if (icon.tooltip && endpoint) {
          sectionButtons.push({
            type: 'button',
            text: icon.tooltip,
            endpoint,
            placement: 'bottom'
          });
        }
      }
    }

    // -- buttons from MusicShelf ('more content' link at bottom, like 'Show All' in search results)
    if (data instanceof YTNodes.MusicShelf) {
      if (data.endpoint && data.bottom_text) {
        const text = this.unwrap(data.bottom_text);
        const endpoint = this.parseEndpoint(data.endpoint);
        if (text && endpoint) {
          sectionButtons.push({
            type: 'button',
            text,
            endpoint,
            placement: 'bottom'
          });
        }
      }
      if (data.bottom_button) {
        const endpoint = this.parseEndpoint(data.bottom_button.endpoint);
        if (data.bottom_button.text && endpoint) {
          sectionButtons.push({
            type: 'button',
            text: data.bottom_button.text,
            endpoint,
            placement: 'bottom'
          });
        }
      }
    }

    if (dataContents) {
      if (Array.isArray(dataContents)) {
        for (const contentItem of dataContents) {
          __parseContentItem(contentItem);
        }

        if (!(data instanceof YTNodes.Grid) && dataContents.some((item) =>
          item instanceof YTNodes.MusicResponsiveListItem ||
          item instanceof YTNodes.PlaylistPanelVideo ||
          item instanceof YTNodes.PlaylistPanelVideoWrapper)) {
          section.itemLayout = 'list';
        }
        else if (dataContents.some((item) => item instanceof YTNodes.MusicTwoRowItem)) {
          section.itemLayout = 'grid';
        }

      }
      else {
        __parseContentItem(dataContents);
      }
    }

    // MusicCardShelf ('Top Results' in search)
    // Need to set correct title and extract the main item of the shelf.
    if (data instanceof YTNodes.MusicCardShelf && data.header instanceof YTNodes.MusicCardShelfHeaderBasic) {
      const title = this.unwrap(data.header.title);
      if (title) {
        section.title = title;
      }
      const mainItem = this.#extractMainItemFromMusicCardShelf(data);
      if (mainItem) {
        section.items.unshift(mainItem);
      }
      section.itemLayout = 'grid';
    }

    // Finalize section contents
    if (section.items.length > 0) {
      // Filter out Watch endpoint items that have no thumbnail (e.g. 'Shuffle All'),
      // And move them to `section.buttons[]`.
      const filteredItems: PageElement.Section['items'] = [];
      for (const item of section.items) {
        if (item.type === 'endpointLink' && EndpointHelper.isType(item.endpoint, EndpointType.Watch) && !item.thumbnail) {
          sectionButtons.push({
            type: 'button',
            text: item.title,
            endpoint: item.endpoint,
            placement: 'top'
          });
        }
        else {
          filteredItems.push(item);
        }
      }
      section.items = filteredItems;
    }

    // Continuation
    if (data.continuation) {
      let endpointType;
      switch (originatingEndpointType) {
        case EndpointType.Browse:
          endpointType = EndpointType.BrowseContinuation;
          break;
        case EndpointType.Search:
          endpointType = EndpointType.SearchContinuation;
          break;
        default:
          endpointType = originatingEndpointType;
      }
      if (endpointType === EndpointType.BrowseContinuation ||
        endpointType === EndpointType.SearchContinuation) {
        section.continuation = {
          type: 'continuation',
          endpoint: {
            type: endpointType,
            payload: {
              token: data.continuation
            }
          }
        };
      }
    }

    if (sectionFilters.length > 0) {
      section.filters = sectionFilters;
    }

    if (sectionButtons.length > 0) {
      section.buttons = sectionButtons;
    }

    if (!section.continuation && section.items.length > 0 && section.buttons && section.buttons.length > 0) {
      // If there is only one button that has Browse / Search endpoint,
      // Assume it refers to 'more content' and move it to `section.continuation`.
      const browseEndpointButtons = section.buttons.filter(
        (button) => EndpointHelper.isType(button.endpoint,
          EndpointType.Browse,
          EndpointType.Search,
          EndpointType.BrowseContinuation,
          EndpointType.SearchContinuation));
      if (browseEndpointButtons.length === 1) {
        const moreContentButton = browseEndpointButtons[0];
        section.continuation = {
          type: 'continuation',
          text: moreContentButton.text,
          endpoint: moreContentButton.endpoint as any
        };
        section.buttons = section.buttons.filter((button) => button !== moreContentButton);
        if (section.buttons.length === 0) {
          delete section.buttons;
        }
      }
    }

    const hasFilters = section.filters && section.filters.length > 0;
    const hasButtons = section.buttons && section.buttons.length > 0;

    if (section.items.length > 0 || hasFilters ||
      hasButtons || section.title || section.continuation) {
      return section;
    }

    return null;
  }

  static parseContentItem(data?: YTHelpers.YTNode | null): SectionItem | ContentItem.Automix | null {
    if (!data) {
      return null;
    }

    if (data instanceof YTNodes.PlaylistPanelVideoWrapper) {
      const target = data.primary || data.counterpart?.first();
      return target ? this.parseContentItem(target) : null;
    }

    // MusicItem (song / video)
    let musicItemType: 'video' | 'song' | null = null;
    if ((data instanceof YTNodes.MusicResponsiveListItem ||
      data instanceof YTNodes.MusicTwoRowItem) &&
      (data.item_type === 'song' || data.item_type === 'video')) {
      musicItemType = data.item_type;
    }
    else if (data instanceof YTNodes.PlaylistPanelVideo) {
      musicItemType = 'video';
    }

    if (musicItemType) {
      let videoId: string | undefined,
        title: string | null = null,
        subtitle: string | null = null,
        endpoint: WatchEndpoint | null = null,
        radioEndpoint: WatchEndpoint | null = null,
        thumbnail: string | null = null,
        trackNumber: string | null = null,
        duration: number | null = null,
        album: ContentItem.MusicItem['album'] | null = null;

      if (data instanceof YTNodes.MusicResponsiveListItem) {
        videoId = data.id;
        title = this.unwrap(data.title);
        subtitle = this.unwrap(data.subtitle);
        endpoint = this.parseEndpoint(this.unwrap(data.overlay?.content?.endpoint), EndpointType.Watch);
        radioEndpoint = this.findRadioEndpoint(data);
        thumbnail = this.parseThumbnail(data.thumbnails);
        trackNumber = this.unwrap(data.index);
        duration = data.duration?.seconds || null;
        if (data.album) {
          const albumEndpoint = this.parseEndpoint(data.album.endpoint, EndpointType.Browse);
          album = {
            title: data.album.name
          };
          if (data.album.id) {
            album.albumId = data.album.id;
          }
          if (albumEndpoint) {
            album.endpoint = albumEndpoint;
          }
        }
      }
      if (data instanceof YTNodes.MusicTwoRowItem) {
        videoId = data.id;
        title = this.unwrap(data.title);
        subtitle = this.unwrap(data.subtitle);
        endpoint = this.parseEndpoint(data.endpoint, EndpointType.Watch);
        radioEndpoint = this.findRadioEndpoint(data);
        thumbnail = this.parseThumbnail(data.thumbnail);
      }
      if (data instanceof YTNodes.PlaylistPanelVideo) {
        videoId = data.video_id;
        title = this.unwrap(data.title);
        endpoint = this.parseEndpoint(data.endpoint, EndpointType.Watch);
        radioEndpoint = this.findRadioEndpoint(data);
        thumbnail = this.parseThumbnail(data.thumbnail);
        if (data.album) {
          album = {
            title: data.album.name
          };
          if (data.album.id) {
            album.albumId = data.album.id;
          }
          const albumEndpoint = this.parseEndpoint(data.album.endpoint, EndpointType.Browse);
          if (albumEndpoint) {
            album.endpoint = albumEndpoint;
          }
          if (data.album.year) {
            album.year = data.album.year;
          }
        }
      }

      if (endpoint && videoId && title) {
        const result: ContentItem.MusicItem = {
          type: musicItemType,
          videoId,
          title,
          endpoint
        };

        if (subtitle) {
          result.subtitle = subtitle;
        }
        if (thumbnail) {
          result.thumbnail = thumbnail;
        }
        if (trackNumber !== null) {
          result.trackNumber = trackNumber;
        }
        if (duration !== null) {
          result.duration = duration;
        }
        if (album) {
          result.album = album;
        }
        if (radioEndpoint) {
          result.radioEndpoint = radioEndpoint;
        }

        const artists = this.#parseArtists(data);
        if (artists && artists.channels.length > 0) {
          result.artists = artists.channels;
          result.artistText = artists.text;
        }

        return result;
      }

      return null;
    }

    // Artist
    const isArtist = (data instanceof YTNodes.MusicResponsiveListItem ||
      data instanceof YTNodes.MusicTwoRowItem) &&
      data.item_type === 'artist';
    const isPrivateArtist = isArtist && data.id?.startsWith('FEmusic_library_privately_owned_artist');

    if (isArtist && !isPrivateArtist) {
      let name: string | null = null,
        thumbnail: string | null = null;

      if (data instanceof YTNodes.MusicResponsiveListItem) {
        name = this.unwrap(data.name);
        thumbnail = this.parseThumbnail(data.thumbnails);
      }
      if (data instanceof YTNodes.MusicTwoRowItem) {
        name = this.unwrap(data.title);
        thumbnail = this.parseThumbnail(data.thumbnail);
      }

      const endpoint = this.parseEndpoint(data.endpoint, EndpointType.Browse);

      if (name && endpoint) {
        const result: ContentItem.Channel = {
          type: 'channel',
          channelId: data.id,
          name,
          endpoint
        };

        const subtitle = this.unwrap(data.subtitle);
        if (subtitle) {
          result.subtitle = subtitle;
        }

        if (thumbnail) {
          result.thumbnail = thumbnail;
        }

        return result;
      }

      return null;
    }

    // Album / Playlist
    let musicFolderType: 'album' | 'playlist' | null = null,
      browseEndpoint: BrowseEndpoint | null = null;

    if ((data instanceof YTNodes.MusicResponsiveListItem ||
      data instanceof YTNodes.MusicTwoRowItem) &&
      (data.item_type === 'album' || data.item_type === 'playlist')) {
      musicFolderType = data.item_type;
    }

    if (musicFolderType) {
      const mData = data as YTNodes.MusicResponsiveListItem & YTNodes.MusicTwoRowItem;
      browseEndpoint = this.parseEndpoint(mData.endpoint, EndpointType.Browse);

      let watchEndpoint: WatchEndpoint | null = null;
      const overlay = mData.overlay || mData.thumbnail_overlay;
      if (overlay?.content?.endpoint) {
        watchEndpoint = this.parseEndpoint(overlay.content.endpoint, EndpointType.Watch);
      }

      const title = this.unwrap(mData.title);

      if (browseEndpoint && watchEndpoint && title) {
        const subtitle = this.unwrap(mData.subtitle);
        const year = mData.year;
        const songCount = mData.song_count;
        const totalDuration = mData.duration?.seconds;

        let result: ContentItem.Album | ContentItem.Playlist;
        if (musicFolderType === 'album') {
          const artists = this.#parseArtists(data);
          const album: ContentItem.Album = {
            type: 'album',
            albumId: mData.id || browseEndpoint.payload.browseId,
            title,
            artists: artists?.channels || [],
            artistText: artists?.text || '',
            endpoint: watchEndpoint,
            browseEndpoint
          };
          if (year) {
            album.year = year;
          }
          result = album;
        }
        else {
          const playlist: ContentItem.Playlist = {
            type: 'playlist',
            playlistId: mData.id || browseEndpoint.payload.browseId,
            title,
            endpoint: watchEndpoint,
            browseEndpoint
          };

          const authors = this.#parseArtists(data);
          if (authors && authors.channels.length > 0) {
            playlist.author = {
              type: 'channel',
              name: authors.channels[0].name,
              channelId: authors.channels[0].channelId,
              thumbnail: authors.channels[0].thumbnail,
              endpoint: authors.channels[0].endpoint
            };
            playlist.authorText = authors.text;
          }

          result = playlist;
        }

        if (subtitle) {
          result.subtitle = subtitle;
        }
        if (songCount) {
          result.songCount = songCount;
        }
        if (totalDuration !== undefined) {
          result.totalDuration = totalDuration;
        }

        let thumbnail: string | null = null;
        if (data instanceof YTNodes.MusicResponsiveListItem) {
          thumbnail = this.parseThumbnail(data.thumbnails);
        }
        if (data instanceof YTNodes.MusicTwoRowItem) {
          thumbnail = this.parseThumbnail(data.thumbnail);
        }
        if (thumbnail) {
          result.thumbnail = thumbnail;
        }

        return result;
      }

      return null;
    }

    // Endpoint link from MusicNavigationButton
    if (data instanceof YTNodes.MusicNavigationButton) {
      const endpoint = this.parseEndpoint(data.endpoint, EndpointType.Browse);
      if (endpoint) {
        const result: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: data.button_text,
          endpoint
        };
        if (data.icon_type) {
          result.icon = data.icon_type;
        }
        return result;
      }

      return null;
    }

    // Endpoint link from MusicResponsiveListItem / MusicTwoRowItem
    if ((data instanceof YTNodes.MusicResponsiveListItem ||
      data instanceof YTNodes.MusicTwoRowItem) &&
      (data.item_type === 'endpoint' || data.item_type === 'library_artist' ||
        isPrivateArtist)) {
      const endpoint = this.parseEndpoint(data.endpoint);
      if (endpoint) {
        let title: string | null = null,
          thumbnail: string | null = null;
        if (data instanceof YTNodes.MusicResponsiveListItem) {
          title = this.unwrap(data.title || data.name);
          thumbnail = this.parseThumbnail(data.thumbnails);
        }
        else {
          title = this.unwrap(data.title);
          thumbnail = this.parseThumbnail(data.thumbnail);
        }
        const subtitle = this.unwrap(data.subtitle);

        if (title) {
          const result: ContentItem.EndpointLink = {
            type: 'endpointLink',
            title,
            endpoint
          };

          if (subtitle) {
            result.subtitle = subtitle;
          }
          if (thumbnail) {
            result.thumbnail = thumbnail;
          }

          return result;
        }
      }

      return null;
    }

    // Endpoint link from DidYouMean
    if (data instanceof YTNodes.DidYouMean) {
      const endpoint = this.parseEndpoint(data.endpoint, EndpointType.Browse);
      if (endpoint) {
        const result: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: `${this.unwrap(data.text)} ${this.unwrap(data.corrected_query)}`,
          endpoint,
          icon: 'YTMUSIC_DID_YOU_MEAN' // Our own icon type
        };
        return result;
      }

      return null;
    }

    // Endpoint link from ShowingResultsFor
    if (data instanceof YTNodes.ShowingResultsFor) {
      const endpoint = this.parseEndpoint(data.original_query_endpoint, EndpointType.Browse);
      if (endpoint) {
        const result: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title: `${this.unwrap(data.showing_results_for)} ${this.unwrap(data.corrected_query)
          }&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.unwrap(data.search_instead_for)} ${this.unwrap(data.original_query)}`,
          endpoint,
          icon: 'YTMUSIC_SHOWING_RESULTS_FOR' // Our own icon type
        };
        return result;
      }
      return null;
    }

    // Automix
    if (data instanceof YTNodes.AutomixPreviewVideo) {
      const endpoint = this.parseEndpoint(data.playlist_video?.endpoint, EndpointType.Watch);
      if (endpoint) {
        const result: ContentItem.Automix = {
          type: 'automix',
          endpoint
        };
        return result;
      }

      return null;
    }

    return null;
  }

  static #parseArtists(data: YTHelpers.YTNode): { channels: ContentItem.Channel[], text: string } | null {

    const _findRunIndexByArtistEndpointCheck = (runs?: (YTMisc.TextRun | YTMisc.EmojiRun)[]) => {
      // Find position of text run with artist endpoint
      let runIndex = runs ? runs.findIndex((run) => {
        if (run instanceof YTMisc.TextRun) {
          const runEndpoint = this.parseEndpoint(run.endpoint, EndpointType.Browse);
          return EndpointHelper.isChannelEndpoint(runEndpoint);
        }
        return false;
      }) : -1;
      // Get the seperator before it
      let separator = runs?.[runIndex - 1]?.text.trim();
      // Move back until we reach '•' or beginning
      while (separator && separator !== '•') {
        runIndex -= 2;
        separator = runs?.[runIndex - 1]?.text.trim();
      }
      return runIndex;
    };

    const _extractFromTextRuns = (runs?: (YTMisc.TextRun | YTMisc.EmojiRun)[], startIndex = 0) => {
      const artists: ContentItem.Channel[] = [];
      let concat = '';
      if (runs) {
        for (let i = startIndex; i < runs.length; i += 2) {
          const run = runs[i];
          const runEndpoint = run instanceof YTMisc.TextRun ? this.parseEndpoint(run.endpoint, EndpointType.Browse) : null;
          const result: ContentItem.Channel = {
            type: 'channel',
            name: run.text
          };
          const channelId = EndpointHelper.isChannelEndpoint(runEndpoint) ? runEndpoint.payload.browseId : null;
          if (channelId) {
            result.channelId = channelId;
          }
          artists.push(result);
          concat += result.name;
          const nextRun = runs[i + 1];
          if (!nextRun || nextRun.text.trim() === '•') {
            break;
          }
          concat += nextRun.text; // Add separator between artist names
        }
      }
      return {
        channels: artists,
        text: concat
      };
    };

    const _reduceGeneric = (arr: ContentItem.Channel[], data: any) => {
      if (data.name) {
        const artist: ContentItem.Channel = {
          type: 'channel',
          name: data.name
        };
        if (data.channel_id) {
          artist.channelId = data.channel_id;
        }
        arr.push(artist);
      }
      return arr;
    };

    if (data instanceof YTNodes.MusicDetailHeader) {
      // Innertube does not parse multiple artists in MusicDetailHeader and also requires
      // Artists to have endpoints. We need to do our own parsing here.
      // However, I am not sure if the parsing logic here is foolproof or will break other
      // Aspects of Innertube, so I shall refrain from pushing it to Innertube repo.

      // We are going to extract artists from the subtitle, which looks something like this:
      // [type (e.g. album, playlist)]•[artist1]&[artist2]•[year]•...
      // The '&' is locale-specific. e.g. 'và' for Vietnamese.
      // So to get artists, we parse each run of the subtitle starting from the one after the first dot,
      // Until we arrive at the next '•'.

      return _extractFromTextRuns(data.subtitle?.runs, 2);
    }

    if (((data instanceof YTNodes.MusicResponsiveListItem || data instanceof YTNodes.MusicTwoRowItem) &&
      (data.item_type === 'song' || data.item_type === 'video')) || data instanceof YTNodes.MusicCardShelf) {

      // Note that there is no checking of item type for MusicCardShelf. We rely on
      // #extractMainItemFromMusicCardShelf() to call this correctly.

      if (data instanceof YTNodes.MusicResponsiveListItem ||
        data instanceof YTNodes.MusicCardShelf) {
        // If language is set to non-English, then videos will most likely be misidentified as songs, since Innertube
        // Determines type by checking the second flex column elements for '* views'. This is fine from the plugins'
        // Perspective, as songs and videos are handled the same way.
        // However, there are some artists that do not have an endpoint and Innertube will leave them out from
        // The artists / authors array. We would have to do our own parsing.

        // Songs appear to have the following columns:
        // [title]    [artist1]&[artist2]     [album]

        // Videos appear to have the following:
        // [title]    [artist1]&[artist2] • [n views*] *Optional

        // Yet in search results, songs and videos are presented as two-line stack:
        // [title]
        // [type (song / video)] • [artist1]&[artist2] • [album or views] • [duration]

        // Let's try our best to parse from these different formats. Note that `subtitle`
        // Refers to the second column (or second line for search results).

        const runIndex = _findRunIndexByArtistEndpointCheck(data.subtitle?.runs);

        if (runIndex >= 0) {
          // Get artists starting from runIndex
          return _extractFromTextRuns(data.subtitle?.runs, runIndex);
        }

        // No text runs with artist endpoint - count dots and guess
        const dotCount = data.subtitle?.runs?.filter((run) => run.text.trim() === '•').length || 0;
        if (dotCount > 2) { // Three or more dots - get artists starting from text run after first dot
          return _extractFromTextRuns(data.subtitle?.runs, 2);
        }

        // Get artists from beginning
        return _extractFromTextRuns(data.subtitle?.runs);
      }

      // MusicTwoRowItem:
      // If language is set to non-English, then songs will most likely be misidentified as videos, since Innertube
      // Determines type by checking if first element is 'Song'. This is fine from the plugins' perspective, as
      // Songs and videos are handled the same way.
      // However, there are some artists that do not have an endpoint and Innertube will leave them out from
      // The artists / authors array. So again, we would have to do our own parsing.

      // Songs appear to have the following subtitle:
      // 'Song' (locale-specific) • [artist1]&[artist2]   --> endpoint/musicVideoType: 'MUSIC_VIDEO_TYPE_ATV'

      // Videos appear to have the following:
      // [artist1]&[artist2] • 'n views*'  *Optional - locale specific  --> endpoint/musicVideoType: 'MUSIC_VIDEO_TYPE_OMV / UGC...'

      // Here we go...

      const runIndex = _findRunIndexByArtistEndpointCheck(data.subtitle?.runs);

      if (runIndex >= 0) {
        // Get artists starting from runIndex
        return _extractFromTextRuns(data.subtitle?.runs, runIndex);
      }

      // No text runs with artist endpoint - rely on music_video_type as last resort
      const watchEndpoint = this.parseEndpoint(data.endpoint, EndpointType.Watch);
      if (watchEndpoint?.musicVideoType === 'MUSIC_VIDEO_TYPE_ATV') {
        return _extractFromTextRuns(data.subtitle?.runs, 2);
      }

      return _extractFromTextRuns(data.subtitle?.runs);
    }

    if (data instanceof YTNodes.PlaylistPanelVideo) {
      // Similar drill to MusicResponsiveListItem
      const runIndex = _findRunIndexByArtistEndpointCheck(data.long_by_line_text.runs);

      if (runIndex >= 0) {
        // Get artists starting from runIndex
        return _extractFromTextRuns(data.long_by_line_text.runs, runIndex);
      }

      // No text runs with artist endpoint - get from beginning
      return _extractFromTextRuns(data.long_by_line_text.runs);
    }

    if (data.hasKey('artists') && Array.isArray(data.artists) && data.artists.length > 0) {
      const artists = data.artists.reduce<ContentItem.Channel[]>((result, a) => _reduceGeneric(result, a), []);
      return {
        channels: artists,
        text: artists.map((artist) => artist.name).join(' & ')
      };
    }
    else if (data.hasKey('authors') && Array.isArray(data.authors) && data.authors.length > 0) {
      const authors = data.authors.reduce<ContentItem.Channel[]>((result, a) => _reduceGeneric(result, a), []);
      return {
        channels: authors,
        text: authors.map((author) => author.name).join(' & ')
      };
    }
    else if (data.hasKey('author')) {
      if (typeof data.author === 'object' && data.author.name) {
        const author: ContentItem.Channel = {
          type: 'channel',
          name: data.author.name
        };
        if (data.author.channel_id) {
          author.channelId = data.author.channel_id;
        }
        return {
          channels: [ author ],
          text: author.name
        };
      }
      else if (typeof data.author === 'string') {
        const author: ContentItem.Channel = {
          type: 'channel',
          name: data.author
        };
        return {
          channels: [ author ],
          text: data.author
        };
      }
    }

    return null;
  }

  static findRadioEndpoint(data: YTHelpers.YTNode): WatchEndpoint | null {
    if ((data instanceof YTNodes.MusicResponsiveListItem ||
      data instanceof YTNodes.MusicTwoRowItem ||
      data instanceof YTNodes.PlaylistPanelVideo) && data.menu) {

      const menu = this.unwrap(data.menu);
      if (menu && menu instanceof YTNodes.Menu) {
        for (const item of menu.items) {
          if (item instanceof YTNodes.MenuNavigationItem && item.icon_type === 'MIX') {
            const endpoint = this.parseEndpoint(item.endpoint, EndpointType.Watch);
            if (endpoint) {
              return endpoint;
            }
          }
        }
      }
    }
    return null;
  }

  static unwrap(data?: 'N/A' | ''): null;
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

  static parseThumbnail(data?: YTMisc.Thumbnail[], resize: { width: number, height: number } = { width: 701, height: 701 }): string | null {
    const thumbnail = data?.[0];
    if (!thumbnail?.url) {
      return null;
    }
    let url = thumbnail.url;
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    const w = thumbnail.width;
    const h = thumbnail.height;
    const param = `=w${w}-h${h}`;
    if (url.indexOf(param)) {
      url = url.replace(param, `=w${resize.width}-h${resize.height}`);
    }

    return url;
  }

  static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | WatchEndpoint | null;
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

    const __buildBrowseEndpoint = (payloadData?: Record<string, any>): BrowseEndpoint | null => {
      const src = payloadData || data?.payload;
      if (src) {
        const result: BrowseEndpoint = {
          type: EndpointType.Browse,
          payload: __createPayload<BrowseEndpoint>([ 'browseId', 'params', 'formData' ], src)
        };
        const pageType = src?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
        if (pageType) {
          result.pageType = pageType;
        }
        return result;
      }

      return null;
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
        return __checkType(__buildBrowseEndpoint());

      case '/search':
      case 'search':
        const searchEndpoint: SearchEndpoint = {
          type: EndpointType.Search,
          payload: __createPayload<SearchEndpoint>([ 'query', 'params' ])
        };
        return __checkType(searchEndpoint);

      case '/player':
      case 'next':
      case '/next':
        const watchEndpoint: WatchEndpoint = {
          type: EndpointType.Watch,
          payload: __createPayload<WatchEndpoint>([ 'videoId', 'playlistId', 'params', 'index', 'playlistSetVideoId' ])
        };
        const musicVideoType = data.payload?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
        if (musicVideoType) {
          watchEndpoint.musicVideoType = musicVideoType;
        }
        return __checkType(watchEndpoint);

      default:
    }

    const commands = data?.payload?.commands;

    if (commands) {
      const cmdBE = commands.find((c: any) => c.browseEndpoint);
      if (cmdBE) {
        return __checkType(__buildBrowseEndpoint(cmdBE.browseEndpoint));
      }

      const cmdRC = commands.find((c: any) => c.browseSectionListReloadEndpoint?.continuation?.reloadContinuationData?.continuation);
      if (cmdRC) {
        const bcEndpoint: BrowseContinuationEndpoint = {
          type: EndpointType.BrowseContinuation,
          isReloadContinuation: true,
          payload: {
            token: cmdRC.browseSectionListReloadEndpoint.continuation.reloadContinuationData.continuation
          }
        };
        return __checkType(bcEndpoint);
      }

      const cmdFB = commands?.find((c: any) => c.musicBrowseFormBinderCommand?.browseEndpoint);
      if (cmdFB) {
        return __checkType(
          __buildBrowseEndpoint(cmdFB.musicBrowseFormBinderCommand.browseEndpoint));
      }
    }

    // ChipCloudChip in Artist -> More Singles / Albums
    if (data?.payload?.continuation?.reloadContinuationData?.continuation) {
      const bcEndpoint: BrowseContinuationEndpoint = {
        type: EndpointType.BrowseContinuation,
        isReloadContinuation: true,
        payload: {
          token: data.payload.continuation.reloadContinuationData.continuation
        }
      };
      return __checkType(bcEndpoint);
    }

    return null;
  }

  static #findNodesByType<T extends YTHelpers.YTNode, K extends YTHelpers.YTNodeConstructor<T>>(
    data: any, type: K, excludeSearchFields: string[] = [], maxDepth = 5, currentDepth = 0): InstanceType<K>[] {

    if (!data || typeof data !== 'object' || currentDepth > maxDepth) {
      return [];
    }

    const unwrapped = this.unwrap(data);
    if (!unwrapped) {
      return [];
    }

    if (Array.isArray(unwrapped) && currentDepth + 1 <= maxDepth) {
      return unwrapped.reduce((results, item) => {
        results.push(...this.#findNodesByType(item, type, excludeSearchFields, maxDepth, currentDepth + 1));
        return results;
      }, []);
    }

    if (unwrapped instanceof type) {
      return [ unwrapped ] as InstanceType<K>[];
    }
    return Object.keys(unwrapped)
      .filter((key) => !excludeSearchFields.includes(key) && key !== 'type')
      .map((key) => unwrapped[key])
      .reduce((results, value) => {
        results.push(...this.#findNodesByType(value, type, excludeSearchFields, maxDepth, currentDepth + 1));
        return results;
      }, []);
  }

  static #convertChipCloudToOption(chipCloud: YTNodes.ChipCloud): PageElement.Option | null {
    const optionValues = chipCloud.chips.reduce<PageElement.Option['optionValues']>((result, chip) => {
      let endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | null;
      let selected = chip.is_selected;
      let isReset = false;
      // Unwrap the text even if it is a string, so that 'N/A' (converted by Innertube
      // From empty text in YT response data) becomes `null`.
      let text = this.unwrap(chip.text);

      const chipEndpointTypes = [
        EndpointType.Browse,
        EndpointType.BrowseContinuation,
        EndpointType.Search
      ] as const;
      if (chip.is_selected && chip.deselect_endpoint) {
        endpoint = this.parseEndpoint(chip.deselect_endpoint, ...chipEndpointTypes);
      }
      else {
        endpoint = this.parseEndpoint(chip.endpoint, ...chipEndpointTypes);
      }

      // Reset chip has no text. Set our own text for it and ensure it's not 'selected'.
      if (!text) {
        text = ytmusic.getI18n('YTMUSIC_RESET');
        selected = false;
        isReset = true;
      }
      if (endpoint) {
        result.push({
          text,
          endpoint,
          selected,
          isReset
        });
      }
      return result;
    }, []);

    if (optionValues.length > 0) {
      return {
        type: 'option',
        subtype: 'chipCloud',
        optionValues
      };
    }

    return null;
  }


  static #convertDropdownToOption(dropdown: YTNodes.Dropdown): PageElement.Option | null {
    const optionValues = dropdown.entries.reduce<PageElement.Option['optionValues']>((result, entry) => {
      const endpoint = this.parseEndpoint(entry.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation);
      if (endpoint) {
        result.push({
          text: entry.label,
          endpoint,
          selected: entry.selected
        });
      }
      return result;
    }, []);

    if (optionValues.length > 0) {
      return {
        type: 'option',
        subtype: 'dropdown',
        title: dropdown.label,
        optionValues
      };
    }

    return null;
  }

  static #convertSortFilterButtonToOption(button: YTNodes.MusicSortFilterButton): PageElement.Option | null {
    const menu = button.menu;
    if (!menu) {
      return null;
    }

    const title = this.unwrap(menu.title);
    const menuItems = menu.options.filter((item) => item instanceof YTNodes.MusicMultiSelectMenuItem);
    const optionValues = menuItems.reduce<PageElement.Option['optionValues']>((result, item) => {
      if (item instanceof YTNodes.MusicMultiSelectMenuItem) {
        const endpoint = this.parseEndpoint(item.endpoint, EndpointType.Browse, EndpointType.BrowseContinuation);
        // For MusicSortFilterButton, endpoint can be `null`.
        result.push({
          text: item.title,
          endpoint,
          selected: item.selected
        });
      }
      return result;
    }, []);

    if (menu && optionValues.length > 0 && title) {
      return {
        type: 'option',
        subtype: 'sortFilter',
        title,
        optionValues
      };
    }

    return null;
  }

  static #extractMainItemFromMusicCardShelf(data: YTNodes.MusicCardShelf) {
    if (data.title) {
      const title = this.unwrap(data.title);
      const endpoint = this.parseEndpoint(data.title.endpoint, EndpointType.Browse, EndpointType.Watch);
      const isBrowseEndpoint = endpoint?.type === EndpointType.Browse;
      const isWatchEndpoint = endpoint?.type === EndpointType.Watch;

      if (!title || (!isBrowseEndpoint && !isWatchEndpoint)) {
        return null;
      }

      const watchEndpoint = this.parseEndpoint(data.thumbnail_overlay?.content?.endpoint, EndpointType.Watch);
      const subtitle = this.unwrap(data.subtitle);

      let thumbnail: string | null = null;
      if (data.thumbnail?.contents[0]) {
        thumbnail = this.parseThumbnail([ data.thumbnail.contents[0] ]);
      }

      let mainItem;
      if (isBrowseEndpoint && endpoint.pageType === 'MUSIC_PAGE_TYPE_ALBUM' && watchEndpoint) {
        let artists: ContentItem.Channel[] = [];
        let artistText = '';
        if (data.subtitle?.runs) {
          artists = data.subtitle.runs.reduce<ContentItem.Channel[]>((result, run, index) => {
            if (run instanceof YTMisc.TextRun) {
              const endpoint = this.parseEndpoint(run.endpoint, EndpointType.Browse);
              if (endpoint?.pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
                result.push({
                  type: 'channel',
                  name: run.text,
                  endpoint
                });
                if (artistText === '') {
                  artistText = run.text;
                }
                else {
                  const separator = data.subtitle?.runs?.[index - 1]?.text || ' & ';
                  artistText += separator + run.text;
                }
              }
            }
            return result;
          }, []);
        }
        const album: ContentItem.Album = {
          type: 'album',
          albumId: endpoint.payload.browseId,
          title,
          artists,
          artistText,
          endpoint: watchEndpoint,
          browseEndpoint: endpoint
        };
        mainItem = album;
      }

      else if (isBrowseEndpoint && endpoint.pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
        const artist: ContentItem.Channel = {
          type: 'channel',
          channelId: endpoint.payload.browseId,
          name: title,
          endpoint
        };
        mainItem = artist;
      }

      else if (isWatchEndpoint && endpoint.musicVideoType &&
        EndpointHelper.isType(watchEndpoint, EndpointType.Watch) && watchEndpoint.payload.videoId) {
        let type: 'song' | 'video';
        switch (endpoint.musicVideoType) {
          case 'MUSIC_VIDEO_TYPE_ATV':
            type = 'song';
            break;
          default:
            type = 'video';
        }
        const musicItem: ContentItem.MusicItem = {
          type,
          title,
          videoId: watchEndpoint.payload.videoId,
          endpoint: watchEndpoint
        };
        const albumRun = data.subtitle.runs?.find((run: any) => EndpointHelper.isAlbumEndpoint(run.endpoint));
        const albumTitle = albumRun ? this.unwrap(albumRun.text) : null;
        if (albumRun && albumTitle) {
          musicItem.album = {
            title: albumRun.text
          };
          const albumEndpoint = this.parseEndpoint((albumRun as YTMisc.TextRun).endpoint, EndpointType.Browse);
          if (albumEndpoint) {
            musicItem.album.albumId = albumEndpoint.payload.browseId;
            musicItem.album.endpoint = albumEndpoint;
          }
        }
        const artists = this.#parseArtists(data);
        if (artists && artists.channels.length > 0) {
          musicItem.artists = artists.channels;
          musicItem.artistText = artists.text;
        }
        mainItem = musicItem;
      }

      else {
        const endpointLink: ContentItem.EndpointLink = {
          type: 'endpointLink',
          title,
          endpoint
        };
        mainItem = endpointLink;
      }

      if (subtitle) {
        mainItem.subtitle = subtitle;
      }
      if (thumbnail) {
        mainItem.thumbnail = thumbnail;
      }

      return mainItem;
    }

    return null;
  }

  static parseLyrics(response: IParsedResponse): MetadataLyrics | null {
    // Try parse synced lyrics
    // Note TimedLyrics is introspected by Innertube
    const syncedLyricsRawData = response.contents_memo?.get('TimedLyrics')?.[0];
    if (syncedLyricsRawData) {
      if (syncedLyricsRawData.hasKey('lyrics_data') && Reflect.has(syncedLyricsRawData.lyrics_data, 'timedLyricsData')) {
        const timedLyricsData = syncedLyricsRawData.lyrics_data.timedLyricsData;
        if (typeof timedLyricsData === 'object') {
          const isValid = Object.values(timedLyricsData).every((line: any) =>
            typeof line === 'object' &&
            Reflect.has(line, 'lyricLine') &&
            Reflect.has(line, 'cueRange') &&
            typeof line.cueRange === 'object' &&
            Reflect.has(line.cueRange, 'startTimeMilliseconds'));
          if (isValid) {
            const lines: MetadataSyncedLyrics['lines'] = Object.values(timedLyricsData).map((line: any) => ({
              text: line.lyricLine,
              start: line.cueRange.startTimeMilliseconds,
              end: line.cueRange.endTimeMilliseconds
            }));
            return {
              type: 'synced',
              lines
            };
          }
        }
      }
      throw Error('Invalid synced lyrics data');
    }
    // Try parse plain lyrics
    const shelf = response.contents_memo?.getType(YTNodes.MusicDescriptionShelf).first();
    if (shelf) {
      const lyricsText = shelf.description.text;
      if (lyricsText) {
        const lines = lyricsText.split('\n');
        return {
          type: 'plain',
          lines
        };
      }
    }

    return null;
  }
}
