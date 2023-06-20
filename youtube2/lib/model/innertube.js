'use strict';

const yt2 = require('../youtube2');
const innerTubeLib = require('volumio-youtubei.js');
const BaseModel = require('./base');
const Text = innerTubeLib.Misc.Text;
const timeToSeconds = innerTubeLib.Utils.timeToSeconds;

class InnerTubeBaseModel extends BaseModel {
  getInnerTube() {
    return yt2.get('innertube');
  }
}

class InnerTubeParser {

  static parseResult(data, originatingEndpoint) {
    switch (originatingEndpoint?.type) {
      case 'watch':
        return this.parseWatchEndpointResult(data);

      case 'search':
        return this.parseSearchEndpointResult(data);

      //case 'browse':
      //case 'browseContinuation':
      default:
        return this.parseBrowseEndpointResult(data);
    }
  }

  static parseWatchEndpointResult(data) {
    const dataContents = this.unwrap(data.contents);
    if (!dataContents) {
      return null;
    }

    const result = {};

    const playlistData = dataContents.playlist;
    if (playlistData) {
      result.playlist = {
        playlistId: playlistData.id,
        title: playlistData.title,
        author: this.parseAuthor(playlistData.author),
      };
      result.playlist.items = playlistData.contents.reduce((items, itemData) => {
        const parsedItem = this.parseMediaItem(itemData);
        if (parsedItem) {
          items.push(parsedItem);
        }
        return items;
      }, []);
      result.playlist.currentIndex = playlistData.current_index;
    }

    if (dataContents.autoplay?.sets?.[0]) {
      result.autoplay = this.sanitizeEndpoint(dataContents.autoplay.sets[0].autoplay_video);
    }

    return result;
  }

  static parseSearchEndpointResult(data) {
    const dataContents = this.unwrap(data.contents);
    const primaryContents = this.unwrap(dataContents?.primary_contents);
    return this.parseBrowseEndpointResult({ contents: primaryContents });
  }

  static parseBrowseEndpointResult(data) {

    const itemContinuations = data.on_response_received_actions?.length > 0 ? data.on_response_received_actions :
      data.on_response_received_endpoints?.length > 0 ? data.on_response_received_endpoints :
        data.on_response_received_commands?.length > 0 ? data.on_response_received_commands : null;
    if (itemContinuations) {
      const actionOrCommands = itemContinuations.filter((c) =>
        c.type === 'appendContinuationItemsAction' ||
        c.type === 'reloadContinuationItemsCommand');
      if (actionOrCommands) {
        const sections = actionOrCommands.reduce((sections, ac) => {
          const parsedSection = this._parseContentToSection({ content: this.unwrap(ac.contents) });
          if (parsedSection) {
            sections.push(parsedSection);
          }
          return sections;
        }, []);
        if (sections) {
          const result = {
            type: 'continuation',
            sections
          };
          return result;
        }
        return null;
      }
    }

    const result = {
      type: 'page',
      header: this._parseHeader(this.unwrap(data.header)),
      sections: []
      // tabs: [ {text, endpoint, selected} ]
    };

    const dataContents = this.unwrap(data.contents);

    const tabs = this.unwrap(dataContents.tabs);
    if (tabs) {
      const reducedTabs = tabs.filter((tab) => tab.type !== 'ExpandableTab')
        .reduce((filtered, tab) => {
          const sanitizeEndpoint = this.sanitizeEndpoint(tab.endpoint);
          const tabTitle = this.unwrap(tab.title);
          if (sanitizeEndpoint && tabTitle) {
            filtered.push({
              text: tabTitle,
              endpoint: sanitizeEndpoint,
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
        result.sections = [];
        const parsedSection = this._parseContentToSection(selectedTab.content);
        if (parsedSection) {
          result.sections.push(parsedSection);
        }
      }
    }
    else {
      result.sections = [];
      const parsedSection = this._parseContentToSection({ content: dataContents });
      if (parsedSection) {
        result.sections.push(parsedSection);
      }
    }

    return result;
  }

  static _parseHeader(data) {
    if (!data) {
      return null;
    }

    const result = {
      // title
      subtitles: []
      // description
      // thumbnail
      // endpoint

      // PlaylistHeader:
      // author
      // shufflePlay
    };

    let headerType = null;

    if (data.type === 'FeedTabbedHeader') {
      headerType = 'feed';
      if (data.title) {
        result.title = this.unwrap(data.title);
      }
    }
    // Channel
    else if (data.type === 'C4TabbedHeader') {
      headerType = 'channel';
      if (data.author?.name) {
        result.title = this.unwrap(data.author.name);
      }

      const authorThumbnail = this.getThumbnail(data.author?.thumbnails);
      if (authorThumbnail) {
        result.thumbnail = authorThumbnail;
      }
      if (data.subscribers) {
        const subscribers = this.unwrap(data.subscribers);
        if (subscribers) {
          result.subtitles.push(subscribers);
        }
      }
      if (data.videos_count) {
        const videosCount = this.unwrap(data.videos_count);
        if (videosCount) {
          result.subtitles.push(videosCount);
        }
      }
      if (data.author?.endpoint) {
        result.endpoint = this.sanitizeEndpoint(data.author.endpoint);
      }
    }
    // E.g. Gaming channel
    else if (data.type === 'InteractiveTabbedHeader') {
      headerType = 'channel';
      result.title = this.unwrap(data.title);
      result.thumbnail = this.getThumbnail(data.box_art);
      const subtitle = this.unwrap(data.metadata);
      if (subtitle) {
        result.subtitles.push(subtitle);
      }
      if (data.description) {
        const description = this.unwrap(data.description);
        if (description) {
          result.description = description;
        }
      }
    }
    // Playlist
    else if (data.type === 'PlaylistHeader') {
      headerType = 'playlist';
      if (data.title) {
        result.title = this.unwrap(data.title);
      }
      if (data.stats) {
        result.subtitles = data.stats.map((stat) => this.unwrap(stat));
      }
      else if (data.videoCount) {
        const videoCount = this.unwrap(data.num_videos);
        if (videoCount) {
          result.subtitles.push(videoCount);
        }
      }
      if (data.description) {
        const playlistDescription = this.unwrap(data.description);
        if (playlistDescription) {
          result.description = playlistDescription;
        }
      }

      result.thumbnail = this.getThumbnail(data.banner?.thumbnails);
      result.endpoint = this.sanitizeEndpoint(data.banner?.on_tap_endpoint); // watch endpoint

      const author = this.parseAuthor(data.author);
      if (author) {
        result.author = author;
      }

      const shufflePlayButton = this.unwrap(data.shuffle_play_button);
      const shufflePlayEndpoint = this.sanitizeEndpoint(shufflePlayButton?.endpoint);
      if (shufflePlayEndpoint) {
        result.shufflePlay = {
          text: this.unwrap(shufflePlayButton.text),
          endpoint: shufflePlayEndpoint
        };
      }
    }
    // Topic
    else if (data.type === 'CarouselHeader') {
      const details = data.contents.find((header) => header.type === 'TopicChannelDetails');
      if (details) {
        headerType = 'channel';
        result.title = this.unwrap(details.title);
        result.thumbnail = this.getThumbnail(details.avatar);
        result.endpoint = this.sanitizeEndpoint(details.endpoint);

        const detailsSubtitle = this.unwrap(details.subtitle);
        if (detailsSubtitle) {
          result.subtitles.push(detailsSubtitle);
        }
      }
    }

    if (result.subtitles.length === 0) {
      delete result.subtitles;
    }

    if (Object.keys(result).length > 0) {
      result.type = headerType;
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
  static _parseContentToSection(data) {
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
      // title: string
      // subtitle: string,
      // filters: Array[ option*... ]
      // continuation: {[text], endpoint}
      // menus: [ option*... ]
      // buttons: [{text, endpoint}]
      // endpoint

      // *option: {
      //    title
      //    optionValues: {
      //      text
      //      endpoint
      //      selected
      //    }
      // }
    };

    const __parseContentItem = (contentItem) => {
      if (nestedSectionTypes.includes(contentItem.type)) {
        // Nested section
        const parsedNested = this._parseContentToSection(contentItem);
        if (parsedNested) {
          section.items.push(parsedNested);
        }
      }
      else if (contentItem.type === 'ContinuationItem') {
        const continuationItem = this.parseContinuationItem(contentItem);
        if (continuationItem) {
          section.continuation = continuationItem;
        }
      }
      else {
        const mediaItem = this.parseMediaItem(contentItem);
        if (mediaItem) {
          section.items.push(mediaItem);
        }
      }
    }

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
      const dataFilters = chips?.filter((chip) => chip.type === 'ChipCloudChip')
        .map((chip) => ({
          text: chip.text,
          endpoint: this.sanitizeEndpoint(chip.endpoint),
          selected: !!chip.is_selected
        }));
      if (dataFilters.length > 0) {
        sectionFilters.push({
          optionValues: dataFilters
        });
      }
    }

    // SectionList.SearchSubMenu
    if (data.sub_menu?.type === 'SearchSubMenu') {
      // One filter per group
      const searchFilters = data.sub_menu.groups.reduce((filters, group) => {
        const title = this.unwrap(group.title);
        const optionValues = group.filters.filter((f) => !f.disabled).map((f) => ({
          text: this.unwrap(f.label),
          endpoint: this.sanitizeEndpoint(f.endpoint),
          selected: !!f.selected
        }));
        if (optionValues.length > 0) {
          filters.push({
            title,
            optionValues
          });
        }
        return filters;
      }, []);

      sectionFilters.push(...searchFilters);
    }

    if (sectionFilters.length > 0) {
      section.filters = sectionFilters;
    }

    const dataTitle = this.unwrap(data.title || data.header?.title);
    const dataSubtitle = this.unwrap(data.subtitle);
    const dataEndpoint = this.sanitizeEndpoint(data.endpoint);
    if (dataTitle) {
      section.title = dataTitle;
    }
    if (dataSubtitle) {
      section.subtitle = dataSubtitle;
    }
    if (dataEndpoint) {
      section.endpoint = dataEndpoint;
    }

    // Menus
    const sectionMenus = [];

    // SectionList.ChannelSubMenu
    if (data.sub_menu?.type === 'ChannelSubMenu') {

      const contentTypeMenu = {
        optionValues: data.sub_menu.content_type_sub_menu_items.map((item) => ({
          text: item.title,
          endpoint: this.sanitizeEndpoint(item.endpoint),
          selected: !!item.selected
        }))
      };

      // If menu only has one option, set that as section title instead (if not not already set)
      if (contentTypeMenu.optionValues.length > 1) {
        sectionMenus.push(contentTypeMenu);
      }
      else if (!section.title) {
        section.title = contentTypeMenu.optionValues[0]?.text;
      }

      const sortSetting = data.sub_menu.sort_setting; // SortFilterSubMenu
      if (sortSetting && sortSetting.sub_menu_items) {
        const sortFilterMenu = {
          title: sortSetting.title,
          optionValues: sortSetting.sub_menu_items.map((item) => ({
            text: item.title,
            endpoint: this.sanitizeEndpoint(item.endpoint),
            selected: !!item.selected
          }))
        };
        sectionMenus.push(sortFilterMenu);
      }
    }

    if (sectionMenus.length > 0) {
      section.menus = sectionMenus;
    }

    // Buttons 
    const sectionButtons = [];

    if (data.menu?.top_level_buttons) { // e.g. 'See All' button in Library
      for (const button of data.menu.top_level_buttons.filter((button) => !button.is_disabled)) {
        const parsedButton = this.parseButton(button);
        if (parsedButton) {
          sectionButtons.push(parsedButton);
        }
      }
    }

    // playAllButton (e.g. in Channel -> Shelf)
    if (data.play_all_button) {
      const parsedButton = this.parseButton(data.play_all_button);
      if (parsedButton) {
        sectionButtons.push(parsedButton);
      }
    }

    if (sectionButtons.length > 0) {
      section.buttons = sectionButtons;
    }

    // TODO: `Shelf` has `sortFilter` not parsed by YouTube.js.
    // Seems to appear only in Library -> Playlists section. Should we 
    // include it?

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

    if (section.items.length > 0 || section.filters?.length > 0 || section.menus?.length > 0 || 
      section.buttons?.length > 0 || section.title || section.continuation) {
        return section;
    }

    return null;
  }

  static parseMediaItem(data) {
    if (!data) {
      return null;
    }

    switch (data.type) {
      case 'Video':
      case 'VideoCard':
      case 'GridVideo':
      case 'PlaylistVideo':
      case 'ReelItem': // published / author / duration  will be null
      case 'PlaylistPanelVideo': // published / viewCount will be null
      case 'GridMovie': // published / viewCount will be null
        return {
          type: 'video',
          videoId: data.id || data.video_id,
          title: this.unwrap(data.title),
          author: this.parseAuthor(data.author),
          thumbnail: this.getThumbnail(data.thumbnails || data.thumbnail) || null,
          viewCount: this.unwrap(data.view_count) || this.unwrap(data.views),
          published: this.unwrap(data.published),
          duration: this.parseDuration(data.duration),
          endpoint: this.sanitizeEndpoint(data.endpoint)
        };

      case 'CompactStation': // Masquerade as playlist
        return {
          type: 'playlist',
          title: this.unwrap(data.title),
          thumbnail: this.getThumbnail(data.thumbnail),
          videoCount: this.unwrap(data.video_count),
          endpoint: this.sanitizeEndpoint(data.endpoint) // watch endpoint
        };

      case 'GameCard':
        return {
          type: 'channel',
          name: this.unwrap(data.game.title),
          channelId: data.game.endpoint.payload.browseId,
          thumbnail: this.getThumbnail(data.game.box_art) || null,
          endpoint: this.sanitizeEndpoint(data.game.endpoint)
        };

      case 'Playlist':
      case 'GridPlaylist':
      case 'Mix':
      case 'GridMix':
        const playlistItem = {
          type: 'playlist',
          playlistId: data.id,
          title: this.unwrap(data.title),
          thumbnail: this.getThumbnail(data.thumbnails) || null,
          author: this.parseAuthor(data.author),
          videoCount: this.unwrap(data.video_count),
          endpoint: this.sanitizeEndpoint(data.endpoint) // Watch endpoint
        };

        if (data.view_playlist?.endpoint) { // Browse endpoint for GridPlaylist
          playlistItem.browseEndpoint = this.sanitizeEndpoint(data.view_playlist.endpoint);
        }

        return playlistItem;

      case 'Channel':
      case 'GridChannel':
        const dataAuthor = this.parseAuthor(data.author);
        if (dataAuthor) {
          const result = {
            type: 'channel',
            channelId: data.id,
            name: dataAuthor.name,
            thumbnail: dataAuthor.thumbnail,
            subscribers: this.unwrap(data.subscribers),
            endpoint: this.sanitizeEndpoint(data.endpoint)
          };

          return result;
        }
        return null;

      case 'GuideEntry':
        return {
          type: 'guideEntry',
          title: this.unwrap(data.title),
          thumbnail: this.getThumbnail(data.thumbnails),
          icon: data.icon_type,
          endpoint: this.sanitizeEndpoint(data.endpoint),
          isPrimary: data.is_primary
        };

      case 'RichItem':
        return this.parseMediaItem(data.content);

      case 'ShowingResultsFor':
        const showResultsForText = this.unwrap(data.showing_results_for) + ' ' + this.unwrap(data.corrected_query) + 
          '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + this.unwrap(data.search_instead_for) + ' ' + this.unwrap(data.original_query);
        return {
          type: 'endpoint',
          title: showResultsForText,
          icon: 'YT2_SHOWING_RESULTS_FOR', // our own icon type to be used as a hint of what this endpoint is about
          endpoint: this.sanitizeEndpoint(data.original_query_endpoint)
        };

      default:
        return null;
    }
  }

  static parseAuthor(data) {
    if (!data) {
      return null;
    }

    if (typeof data === 'string' || data instanceof Text) {
      return {
        name: this.unwrap(data)
      };
    }

    return {
      channelId: data.id,
      name: this.unwrap(data.name),
      thumbnail: this.getThumbnail(data.thumbnails),
      endpoint: this.sanitizeEndpoint(data.endpoint)
    };
  }

  static parseDuration(data) {
    if (!data) {
      return null;
    }

    if (typeof data === 'object' && data.seconds) {
      return data.seconds;
    }

    if (data instanceof Text) {
      const s = this.unwrap(data);
      if (s) {
        return timeToSeconds(s);
      }
    }

    if (typeof data === 'string') {
      return timeToSeconds(data);
    }

    return data;
  }

  static parseContinuationItem(data) {
    if (!data || !data.endpoint) {
      return null;
    }

    const result = {
      endpoint: this.sanitizeEndpoint(data.endpoint)
    };

    if (data.button?.text) {
      result.text = this.unwrap(data.button.text);
    }

    return result.endpoint ? result : null;
  }

  static parseButton(data) {
    if (!data) {
      return null;
    }

    const buttonEndpoint = this.sanitizeEndpoint(data.endpoint);
    const buttonText = this.unwrap(data.text);
    if (buttonEndpoint && buttonText) {
      return {
        text: buttonText,
        endpoint: buttonEndpoint
      };
    }

    return null;
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
    else if (typeof data === 'string' || data instanceof Text) {
      const s = (typeof data === 'string') ? data : data.toString();
      return (s === 'N/A' || s === '') ? null : s;
    }

    return data;
  }

  static getThumbnail(data) {
    const url = data?.[0]?.url;
    if (url?.startsWith('//')) {
      return 'https:' + url;
    }
    return url;
  }

  static sanitizeEndpoint(data) {

    const createPayload = (fields, payloadData) => {
      const payload = {};
      const src = payloadData || data.payload;
      if (src) {
        for (const field of fields) {
          if (src[field] !== undefined) {
            payload[field] = src[field];
          }
        }
      }
      return payload;
    }

    switch (data?.metadata?.api_url) {
      case '/browse':
      case 'browse':
        if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_BROWSE') {
          return {
            type: 'browseContinuation',
            payload: {
              token: data.payload.token
            }
          };
        }
        return {
          type: 'browse',
          payload: createPayload(['browseId', 'params'])
        };

      case '/search':
      case 'search':
        if (data?.payload?.token && data.payload.request === 'CONTINUATION_REQUEST_TYPE_SEARCH') {
          return {
            type: 'searchContinuation',
            payload: {
              token: data.payload.token
            }
          };
        }
        return {
          type: 'search',
          payload: createPayload(['query', 'params'])
        };

      case '/player':
        return {
          type: 'watch',
          payload: createPayload(['videoId', 'playlistId', 'params', 'index'])
        };

      default:
    }

    if (data?.metadata?.page_type === 'WEB_PAGE_TYPE_SHORTS') {
      // For now, forget about sequence and treat reelWatchEndpoints 
      // as normal watch endpoints
      return {
        type: 'watch',
        payload: createPayload(['videoId'])
      };
    }

    return null;
  }

}

module.exports = {
  InnerTubeBaseModel,
  InnerTubeParser
};
