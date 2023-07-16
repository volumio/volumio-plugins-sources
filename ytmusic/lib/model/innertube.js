'use strict';

const Parser = require('volumio-youtubei.js').Parser;
const SectionListContinuation = require('volumio-youtubei.js').SectionListContinuation;
const Text = require('volumio-youtubei.js').Misc.Text;

const BaseModel = require(__dirname + '/base');

const MAX_APPEND_SECTIONS_COUNT = 10;

class InnerTubeBaseModel extends BaseModel {

  async getBrowseResultsByContinuation(continuation, payload = {}) {
    const innerTube = this.getInnerTube();
    const response = await innerTube.actions.execute('/browse', { ...payload, token: continuation.token, client: 'YTMUSIC' });
    const page = Parser.parseResponse(response.data);
    const data = page.continuation_contents;
    const fullData = {
      sections: [
        {
          ...(data || {}),
          isContinuation: true
        }
      ]
    };

    return InnerTubeParser.parseFeed(fullData);
  }

  async expandSectionList(sectionList) {
    if (!sectionList) {
      throw new Error('No results');
    }

    sectionList.contents = InnerTubeParser.unwrapArray(sectionList.contents) || [];
    
    const innerTube = this.getInnerTube();
    let sectionListContinuation = sectionList.continuation;
    let appendCount = 0;
    while (sectionListContinuation && appendCount < MAX_APPEND_SECTIONS_COUNT) {
      const response = await innerTube.actions.execute('/browse', { token: sectionListContinuation, client: 'YTMUSIC' });
      const page = Parser.parseResponse(response.data);
      const contSectionList = page.continuation_contents?.as(SectionListContinuation);
      const moreSections = contSectionList?.contents || [];
      sectionList.contents.push(...moreSections);
      sectionListContinuation = contSectionList?.continuation;
      appendCount++;
    }
  }
}

class InnerTubeParser {
  /**
   * data {
   *  header
   *  sections
   * }
   *
   * result {
   *  title
   *  header: available for feedTypes: album, playlist, artist
   *  sections
   * }
   */

  static parseFeed(data, feedType) {
    if (!data) {
      return null;
    }

    const parsed = {};

    const dataHeader = this.unwrapItem(data.header);
    const feedHeader = dataHeader && ['album', 'playlist', 'artist'].includes(feedType) ? this.parseItem({ ...dataHeader, item_type: feedType }) : null;
    const parsedSections = this.unwrapArray(data.sections)?.map((section) => this.parseSection(section));

    if (feedHeader) {
      parsed.header = feedHeader;
    }
    else if (dataHeader) {
      parsed.title = this.unwrapText(dataHeader.title);
    }
    if (parsedSections) {
      parsed.sections = parsedSections;
    }

    return Object.keys(parsed).length > 0 ? parsed : null;
  }

  static parseItem(data) {

    const supportedTypes = ['video', 'song', 'PlaylistPanelVideoWrapper', 'PlaylistPanelVideo', 
      'artist', 'album', 'playlist', 'MusicNavigationButton', 'endpoint', 'library_artist', 'DidYouMean', 
      'ShowingResultsFor', 'AutomixPreviewVideo'];
    if (!supportedTypes.includes(data.item_type) && !supportedTypes.includes(data.type)) {
      return null;
    }

    // Special case: privately owned artists (in Library -> Artists -> Uploads) should be treated as 'library_artist'
    const isPrivateArtist = data.item_type === 'artist' && data.id?.startsWith('FEmusic_library_privately_owned_artist');

    const parsed = {};

    if (data.type === 'PlaylistPanelVideoWrapper') {
      data = data.primary || data.counterpart?.[0];
      if (!data) {
        return null;
      }
    }

    if (data.type === 'MusicResponsiveListItem' || data.type === 'PlaylistPanelVideo') {
      parsed.displayHint = 'list';
    }
    else if (data.type === 'MusicTwoRowItem') {
      parsed.displayHint = 'grid';
    }

    if (data.item_type === 'video' || data.item_type === 'song' || data.type === 'PlaylistPanelVideo') {
      parsed.type = data.item_type === 'song' ? 'song' : 'video';
      parsed.id = data.video_id || data.id;
      parsed.trackNumber = this.unwrapText(data.index);
      parsed.title = this.unwrapText(data.title);
      parsed.subtitle = this.unwrapText(data.subtitle);
      parsed.duration = data.duration?.seconds;
      parsed.thumbnail = this.extractThumbnail(data);
      parsed.artists = this.extractArtists(data);
      parsed.artistText = parsed.artists.map((artist) => artist.name).join(' & ');
      parsed.album = data.album ? {
        id: data.album.id,
        title: data.album.name,
        year: data.album.year
      } : null;
      parsed.albumText = data.album?.name || '';
      if (data.type === 'MusicResponsiveListItem') {
        // Get watch endpoint
        // Note: do not get endpoint from title runs because it won't have params
        const overlayEndpoint = this.sanitizeEndpoint(this.unwrapItem(this.unwrapItem(data.overlay)?.content)?.endpoint); // Content should be a MusicPlayButton
        if (overlayEndpoint?.actionType === 'watch') {
          parsed.endpoint = overlayEndpoint;
        }
      }
      else {
        this.setSanitizedEndpoint(parsed, data);
      }
    }
    else if (data.item_type === 'artist' && !isPrivateArtist) {
      parsed.type = 'artist';
      parsed.id = data.id;
      parsed.name = this.unwrapText(data.name) || this.unwrapText(data.title);
      parsed.subtitle = this.unwrapText(data.subtitle);
      parsed.description = this.unwrapText(data.description);
      parsed.thumbnail = this.extractThumbnail(data);
    }
    else if (data.item_type === 'album' || data.item_type === 'playlist') {
      parsed.type = data.item_type;
      parsed.id = data.id;

      parsed.title = this.unwrapText(data.title);
      parsed.subtitle = this.unwrapText(data.subtitle);
      parsed.secondSubtitle = this.unwrapText(data.second_subtitle);
      parsed.year = data.year;
      parsed.songCount = data.song_count;
      parsed.totalDuration = data.total_duration;
      if (data.item_type === 'album') {
        parsed.artists = this.extractArtists(data);
        parsed.artistText = parsed.artists.map((artist) => artist.name).join(' & ');
      }
      else { // playlist
        parsed.author = this.extractArtists(data)[0] || null;
        parsed.authorText = parsed.author?.name || '';
      }
      parsed.thumbnail = this.extractThumbnail(data);
    }
    else if (data.type === 'MusicNavigationButton') {
      parsed.type = 'endpoint';
      this.setSanitizedEndpoint(parsed, data);
      parsed.label = this.unwrapText(data.button_text);
    }
    else if (data.item_type === 'endpoint' || data.item_type === 'library_artist' || isPrivateArtist) {
      parsed.type = data.item_type === 'endpoint' ? 'endpoint' : 'libraryArtist';
      parsed.label = this.unwrapText(data.title) || this.unwrapText(data.name);
      parsed.subtitle = this.unwrapText(data.subtitle);
      parsed.thumbnail = this.extractThumbnail(data);
      this.setSanitizedEndpoint(parsed, data);
      if (isPrivateArtist && parsed.endpoint?.actionType === 'browse') {
        parsed.endpoint.extras = { pageType: 'MUSIC_PAGE_TYPE_LIBRARY_ARTIST' };
      }
    }
    else if (data.type === 'DidYouMean') {
      parsed.type = 'endpoint';
      parsed.label = this.unwrapText(data.text) + ' ' + this.unwrapText(data.corrected_query);
      this.setSanitizedEndpoint(parsed, data);
      parsed.displayHint = 'didYouMean';
    }
    else if (data.type === 'ShowingResultsFor') {
      parsed.type = 'endpoint';
      parsed.label = this.unwrapText(data.showing_results_for) + ' ' + this.unwrapText(data.corrected_query) + 
        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + this.unwrapText(data.search_instead_for) + ' ' + this.unwrapText(data.original_query);
      this.setSanitizedEndpoint(parsed, { endpoint: data.original_query_endpoint });
      parsed.displayHint = 'showingResultsFor';
    }
    else if (data.type === 'AutomixPreviewVideo') {
      parsed.type = 'automix';
      this.setSanitizedEndpoint(parsed, data.playlist_video);
    }
    else {
      return null;
    }

    return parsed;
  }

  static parseSection(data) {
    const parsed = {
      type: 'section'
    };

    const options = [], startItems = [], endItems = [];

    const dataHeader = this.unwrapItem(data.header);
    let dataContents = this.unwrapArray(data.contents || data.items);
    let dataContinuation = data.continuation;
    // If first content item itself has `items` or `contents` field, e.g. Grid or MusicShelf,
    // then replace contents with those.
    if (dataContents?.[0]?.items || dataContents?.[0]?.contents) {
      dataContinuation = dataContents?.[0]?.continuation;
      dataContents = this.unwrapArray(dataContents?.[0]?.items || dataContents?.[0]?.contents);
    }

    // These camel case fields are provided by the model, which may be useful for view handlers
    parsed.isContinuation = !!data.isContinuation;
    // `params` are mostly specified in endpoints but not returned back in the response. They usually 
    // encapsulate sorting / filtering options applied to section contents.
    if (data.playlistParams) {
      parsed.playlistParams = data.playlistParams;
    }
    parsed.isWatch = !!data.isWatch; // Whether section contents were obtained from watch / watch_playlist endpoint

    // Nodes such as MusicPlaylistShelf and PlaylistPanel provide a playlistId. 
    // Note that `playlistId` does not necessarily refer to the ID of a playlist. It can be the ID of any list of songs
    // such as album, artist's songs, etc.
    if (data.playlist_id) {
      parsed.playlistId = data.playlist_id;
    }

    // Section tabs
    if (dataHeader?.tabs) {
      parsed.tabs = dataHeader.tabs.map((tab) => this.parseTab(tab));
    }

    // Section title and strapline
    const title = this.unwrapText(data.title) || this.unwrapText(dataHeader?.title);
    if (title) {
      parsed.title = title;
    }
    else if (dataHeader?.tabs) {
      parsed.title = this.unwrapText(dataHeader.tabs.find((tab) => tab.selected)?.title);
    }
    if (data.strapline || dataHeader?.strapline) {
      parsed.strapline = this.unwrapText(data.strapline || dataHeader?.strapline);
    }

    // Section contents and continuation
    if (dataContents) {
      // Filter out watch playlist endpoint items that have no thumbnail (e.g. 'Shuffle All').
      // Why? Because Volumio will explode it with other items in the same list and we
      // don't wnat that for a list consisting only of videos or songs.
      parsed.contents = dataContents.reduce((list, item) => {
        const parsed = this.parseItem(item);
        if (parsed) {
          list.push(parsed);
        }
        return list;
      }, []);

      if (dataContinuation) {
        parsed.continuation = dataContinuation;
      }
    }

    // Section 'more content'
    if (dataHeader?.more_content) {
      parsed.moreContent = {
        label: this.unwrapText(dataHeader.more_content.text)
      };
      this.setSanitizedEndpoint(parsed.moreContent, dataHeader.more_content);
    }
    else if (data.endpoint && data.bottom_text) {
      parsed.moreContent = {
        label: this.unwrapText(data.bottom_text),
      };
      this.setSanitizedEndpoint(parsed.moreContent, data)
    }
    else if (dataHeader?.end_icons?.[0]?.endpoint) {
      const icon = dataHeader?.end_icons?.[0];
      parsed.moreContent = {
        label: this.unwrapText(icon.tooltip),
      };
      this.setSanitizedEndpoint(parsed.moreContent, icon);
    }

    // Finalize section contents and start items
    if (parsed.contents) {
      // Filter out watch_playlist endpoint items that have no thumbnail (e.g. 'Shuffle All'). Place them
      // in start items instead.
      const filteredContents = [];
      for (const item of parsed.contents) {
        if (item.endpoint?.actionType === 'watchPlaylist' && !item.thumbnail) {
          startItems.push(item);
        }
        else {
          filteredContents.push(item);
        }
      }
      parsed.contents = filteredContents;
    }

    // Section end items - converted from bottom button
    const dataBottomButtonEndpoint = this.sanitizeEndpoint(data.bottom_button?.endpoint);
    if (dataBottomButtonEndpoint?.actionType === 'browse') {
      endItems.push(this.convertButtonToEndpoint(data.bottom_button));
    }

    // Section options - converted from chips
    if (dataHeader?.chips) {
      options.push(this.convertChipsToOption(dataHeader.chips));
    }

    // Section options - convert from dropdowns
    const dropdowns = this.findNodesByType([dataHeader, data.subheaders], 'Dropdown');
    if (dropdowns.length > 0) {
      options.push(...dropdowns.map((dropdown) => this.convertDropdownToOption(dropdown)));
    }

    // Section options - converted from sort filter buttons
    const sortFilterButtons = this.findNodesByType([dataHeader, data.subheaders], 'MusicSortFilterButton');
    if (sortFilterButtons.length > 0) {
      options.push(...sortFilterButtons.map((button) => this.convertSortFilterButtonToOption(button)));
    }

    if (options.length > 0) {
      parsed.options = options;
    }

    if (startItems.length > 0) {
      parsed.startItems = startItems;
    }

    if (endItems.length > 0) {
      parsed.endItems = endItems;
    }

    return parsed;
  }

  static parseTab(data) {
    if (!data) {
      return null;
    }

    const result = {
      title: this.unwrapText(data.title),
      selected: !!data.selected,
    };

    this.setSanitizedEndpoint(result, data);

    return result;
  }

  static unwrapText(t) {
    const s = (typeof t === 'string') ? t : (t instanceof Text) ? t.toString() : null;
    return (s === 'N/A' || s === '') ? null : s;
  }

  static unwrapItem(data) {
    if (!data) {
      return null;
    }
    if (data.constructor.name === 'SuperParsedResult' && data.is_node) {  // SuperParsedResult
      return data.item();
    }
    return data;
  }

  static unwrapArray(data) {
    if (!data) {
      return null;
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (data.constructor.name === 'SuperParsedResult' && data.is_array) { // SuperParsedResult
      return data.array();
    }
    return null;
  }

  static extractThumbnail(data) {
    let thumbnail = null;
    if (Array.isArray(data.thumbnail)) {
      thumbnail = data.thumbnail[0];
    }
    else if (Array.isArray(data.thumbnails)) {
      thumbnail = data.thumbnails[0];
    }
    else if (Array.isArray(data.thumbnail?.contents)) {
      thumbnail = data.thumbnail.contents[0];
    }

    return thumbnail ? this.resizeThumbnail(thumbnail, { width: 701, height: 701 }) : null;
  }

  static resizeThumbnail(thumbnail, size) {
    const url = thumbnail?.url;
    const w = thumbnail?.width;
    const h = thumbnail?.height;
    if (!url || !w || !h || isNaN(size?.width) || isNaN(size?.height)) {
      return thumbnail;
    }

    const param = `=w${w}-h${h}`;
    if (url.indexOf(param)) {
      return {
        url: url.replace(param, `=w${size.width}-h${size.height}`),
        width: size.width,
        height: size.height
      };
    }
    return thumbnail;
  }

  static extractArtists(data) {

    const findRunIndexByArtistEndpointCheck = (runs) => {
      // Find position of text run with artist endpoint
      let runIndex = runs ? runs.findIndex((run) => (this.sanitizeEndpoint(run.endpoint))?.payload?.browseId?.startsWith('UC')) : -1;
      // Get the seperator before it
      let separator = runs?.[runIndex - 1]?.text.trim();
      // Move back until we reach '•' or beginning
      while (separator && separator !== '•') {
        runIndex -= 2;
        separator = runs?.[runIndex - 1]?.text.trim();
      }
      return runIndex;
    };

    const extractFromTextRuns = (runs, startIndex = 0) => {
      const artists = [];
      if (runs) {
        for (let i = startIndex; i < runs.length; i += 2) {
          const run = runs[i];
          const runEndpoint = this.sanitizeEndpoint(run.endpoint);
          artists.push({
            id: runEndpoint?.payload?.browseId?.startsWith('UC') ? runEndpoint.payload.browseId : null,
            name: run.text,
          });
          const nextRun = runs[i + 1];
          if (!nextRun || nextRun.text.trim() === '•') {
            break;
          }
        }
      }
      return artists;
    };

    if (data.type === 'MusicDetailHeader') {
      // InnerTube does not parse multiple artists in MusicDetailHeader and also requires 
      // artists to have endpoints. We need to do our own parsing here.
      // However, I am not sure if the parsing logic here is foolproof or will break other 
      // aspects of InnerTube, so I shall refrain from pushing it to InnerTube repo.

      // We are going to extract artists from the subtitle, which looks something like this:
      // [type (e.g. album, playlist)]•[artist1]&[artist2]•[year]•...
      // The '&' is locale-specific. e.g. 'và' for Vietnamese.
      // So to get artists, we parse each run of the subtitle starting from the one after the first dot, 
      // until we arrive at the next '•'.

      return extractFromTextRuns(data.subtitle?.runs, 2);
    }

    if ((data.item_type === 'song' || data.item_type === 'video')) {
      if (data.type === 'MusicResponsiveListItem') {
        // If language is set to non-English, then videos will most likely be misidentified as songs, since InnerTube
        // determines type by checking the second flex column elements for '* views'. This is fine from the plugins' 
        // perspective, as songs and videos are handled the same way. 
        // However, there are some artists that do not have an endpoint and InnerTube will leave them out from 
        // the artists / authors array. We would have to do our own parsing.
        
        // Songs appear to have the following columns:
        // [title]    [artist1]&[artist2]     [album]

        // Videos appear to have the following:
        // [title]    [artist1]&[artist2] • [n views*] *Optional

        // Yet in search results, songs and videos are presented as two-line stack:
        // [title]
        // [type (song / video)] • [artist1]&[artist2] • [album or views] • [duration]

        // Let's try our best to parse from these different formats. Note that `subtitle`
        // refers to the second column (or second line for search results).

        const runIndex = findRunIndexByArtistEndpointCheck(data.subtitle?.runs);

        if (runIndex >= 0) {
          // Get artists starting from runIndex
          return extractFromTextRuns(data.subtitle?.runs, runIndex);
        }

        // No text runs with artist endpoint - count dots and guess
        const dotCount = data.subtitle?.runs?.filter((run) => run.text.trim() === '•').length || 0;
        if (dotCount > 2) {  // Three or more dots - get artists starting from text run after first dot
          return extractFromTextRuns(data.subtitle?.runs, 2);
        }
        else {
          // Get artists from beginning
          return extractFromTextRuns(data.subtitle?.runs);
        }
      }
      else if (data.type === 'MusicTwoRowItem') {
        // If language is set to non-English, then songs will most likely be misidentified as videos, since InnerTube
        // determines type by checking if first element is 'Song'. This is fine from the plugins' perspective, as
        // songs and videos are handled the same way. 
        // However, there are some artists that do not have an endpoint and InnerTube will leave them out from 
        // the artists / authors array. So again, we would have to do our own parsing.

        // Songs appear to have the following subtitle:
        // 'Song' (locale-specific) • [artist1]&[artist2]   --> endpoint/musicVideoType: 'MUSIC_VIDEO_TYPE_ATV'

        // Videos appear to have the following:
        // [artist1]&[artist2] • 'n views*'  *Optional - locale specific  --> endpoint/musicVideoType: 'MUSIC_VIDEO_TYPE_OMV / UGC...'

        // Here we go...

        const runIndex = findRunIndexByArtistEndpointCheck(data.subtitle?.runs);

        if (runIndex >= 0) {
          // Get artists starting from runIndex
          return extractFromTextRuns(data.subtitle?.runs, runIndex);
        }

        // No text runs with artist endpoint - rely on music_video_type as last resort
        if ((this.sanitizeEndpoint(data.endpoint))?.extras?.musicVideoType === 'MUSIC_VIDEO_TYPE_ATV') {
          return extractFromTextRuns(data.subtitle?.runs, 2);
        }
        else {
          return extractFromTextRuns(data.subtitle?.runs);
        }
      }
    }

    if (data.artists && data.artists.length > 0) {
      return data.artists.map((artist) => ({ id: artist.channel_id, name: artist.name }));
    }
    else if (data.authors && data.authors.length > 0) {
      return data.authors.map((author) => ({ id: author.channel_id, name: author.name }));
    }
    else if (data.author) {
      if (typeof data.author === 'object') {
        return [{ id: data.author.channel_id, name: data.author.name }];
      }
      else if (typeof data.author === 'string') {
        return [{ id: null, name: data.author}];
      }
    }

    return [];
  }

  static convertButtonToEndpoint(data) {
    const result = {
      type: 'endpoint',
      label: this.unwrapText(data.text),
    };
    
    this.setSanitizedEndpoint(result, data);

    return result;
  };

  static convertDropdownToOption(data) {
    return {
      type: 'option',
      label: this.unwrapText(data.label),
      optionValues: this.unwrapArray(data.entries) || []
    };
  }

  static convertChipsToOption(data) {
    const result = {
      type: 'option',
      optionValues: []
    };

    for (const chip of data) {
      const ov = {
        label: chip.text,
        selected: chip.is_selected
      };
      this.setSanitizedEndpoint(ov, chip);

      result.optionValues.push(ov);
    }

    return result;
  }

  static convertTabsToOption(data) {
    const result = {
      type: 'option',
      optionValues: []
    };
    
    for (const tab of data) {
      const ov = {
        label: tab.title,
        selected: tab.selected
      };
      this.setSanitizedEndpoint(ov, tab);

      result.optionValues.push(ov);
    }

    return result;
  }

  static convertSortFilterButtonToOption(button) {
    const menu = button.menu;
    const menuItems = menu.options.filter((item) => item.type === 'MusicMultiSelectMenuItem');

    const result = {
      type: 'option',
      label: this.unwrapText(menu.title),
      optionValues: []
    };

    for (const item of menuItems) {
      const ov = {
        label: item.title,
        selected: item.selected
      };
      this.setSanitizedEndpoint(ov, item);

      result.optionValues.push(ov);
    }

    return result;
  }

  static findNodesByType(data, type, excludeSearchFields = [], maxDepth = 5, currentDepth = 0) {
    if (!data || typeof data !== 'object' || currentDepth > maxDepth) {
      return [];
    }

    const unwrapped = this.unwrapArray(data) || this.unwrapItem(data);

    if (!unwrapped) {
      return [];
    }

    if (Array.isArray(unwrapped) && currentDepth + 1 <= maxDepth) {
      return unwrapped.reduce((results, item) => {
        results.push(...this.findNodesByType(item, type, excludeSearchFields, maxDepth, currentDepth + 1));
        return results;
      }, []);
    }
    
    if (typeof unwrapped === 'object') {
      if (unwrapped.type === type) {
        return [unwrapped];
      }
      return Object.keys(unwrapped)
        .filter((key) => !excludeSearchFields.includes(key) && key !== 'type')
        .map((key) => unwrapped[key])
        .reduce((results, value) => {
          results.push(...this.findNodesByType(value, type, excludeSearchFields, maxDepth, currentDepth + 1));
          return results;
        }, []);
    }

    return [];
  }

  static setSanitizedEndpoint(target, src) {
    if (src?.endpoint) {
      const sanitized = this.sanitizeEndpoint(src.endpoint);
      if (sanitized) {
        target.endpoint = sanitized;
      }
    }
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

    const buildBrowseEndpoint = (ep, payloadData) => {
      const src = payloadData || data.payload;
      ep.actionType = 'browse';
      ep.payload = createPayload(['browseId', 'params', 'formData'], src);
      const pageType = src?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
      if (pageType) {
        ep.extras = { pageType };
      }
    }

    const endpoint = {};

    switch (data?.metadata?.api_url) {
      case '/browse':
        buildBrowseEndpoint(endpoint);
        return endpoint;

      case '/player':
        endpoint.actionType = 'watch';
        endpoint.payload = createPayload(['videoId', 'playlistId', 'params']);
        const musicVideoType = data.payload?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType;
        if (musicVideoType) {
          endpoint.extras = { musicVideoType };
        }
        return endpoint;

      case '/next':
        endpoint.actionType = 'watchPlaylist';
        endpoint.payload = createPayload(['playlistId', 'params']);
        return endpoint;

      case '/search':
        endpoint.actionType = 'search';
        endpoint.payload = createPayload(['query', 'params']);
        return endpoint;
        
      default:
    }

    const commands = data?.payload?.commands;

    const cmdBE = commands?.find((c) => c.browseEndpoint);
    if (cmdBE) {
      buildBrowseEndpoint(endpoint, cmdBE.browseEndpoint);
      return endpoint;
    }

    const cmdRC = commands?.find((c) => c.browseSectionListReloadEndpoint?.continuation?.reloadContinuationData);
    if (cmdRC) {
      endpoint.actionType = 'continuation';
      endpoint.payload = {
        continuation: cmdRC.browseSectionListReloadEndpoint.continuation.reloadContinuationData.continuation
      }
      return endpoint;
    }

    const cmdFB = commands?.find((c) => c.musicBrowseFormBinderCommand?.browseEndpoint);
    if (cmdFB) {
      buildBrowseEndpoint(endpoint, cmdFB.musicBrowseFormBinderCommand.browseEndpoint);
      return endpoint;
    }

    return null;
  }
}

module.exports = {
  InnerTubeBaseModel,
  InnerTubeParser
};
