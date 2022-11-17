'use strict';

const BaseParser = require(__dirname + '/base');

const KNOWN_ENDPOINT_ICONS = {
  'FEmusic_moods_and_genres_category': 'fa fa-music',
  'FEmusic_new_releases': 'fa fa-certificate',
  'FEmusic_charts': 'fa fa-line-chart',
  'FEmusic_moods_and_genres': 'fa fa-smile-o'
};

class EndpointItemParser extends BaseParser {

  parseToListItem(data) {
    const endpointType = this.getEndpointType(data?.endpoint);
    if (!endpointType) {
      return null;
    }
    const baseUri = this.getUri();
    const item = {
      service: 'ytmusic',
      // Setting type to 'album' is important for watch endpoints, as we
      // only want this item to be exploded and not others in the same list when
      // it is clicked.
      type: endpointType === 'watch' ? 'album' : 'ytmusicEndpointItem',
      title: data.label || data.text,
      uri: baseUri + this.getUriFromEndpoint(data.endpoint) //+ '@noExplode=1',
    }
    if (data.subtitle) {
      item.artist = data.subtitle;
    }
    if (data.thumbnail) {
      item.albumart = data.thumbnail?.url;
    }
    else if (data.displayHint === 'didYouMean') {
      item.icon = 'fa fa-question-circle-o';
    }
    else if (data.displayHint === 'showingResultsFor') {
      item.icon = 'fa fa-info-circle';
    }
    else {
      item.icon = this.getIconFromEndpoint(data.endpoint);
    }
    return item;
  }

  getEndpointType(endpoint) {    
    if (endpoint?.browse?.id) {
      return 'browse';
    }
    else if (endpoint?.search) {
      return 'search';
    }
    else if (endpoint?.watch_playlist?.playlist_id) {
      return 'watch';
    }

    return null;
  }

  getUriFromEndpoint(endpoint, ignorePageType = false) {
    if (!ignorePageType) {
      switch (endpoint?.browse?.page_type) {
        case 'MUSIC_PAGE_TYPE_ALBUM':
          return `/album@albumId=${encodeURIComponent(endpoint.browse.id)}`;
        case 'MUSIC_PAGE_TYPE_PLAYLIST':
          return `/playlist@playlistId=${encodeURIComponent(endpoint.browse.id)}`;
        case 'MUSIC_PAGE_TYPE_ARTIST':
          return `/artist@artistId=${encodeURIComponent(endpoint.browse.id)}`;
        default:
      }
    }
    const param = encodeURIComponent(JSON.stringify(endpoint));
    if (endpoint.search) {
      return `/search@endpoint=${param}`;
    }
    return `/generic@endpoint=${param}`;
  }

  getIconFromEndpoint(endpoint) {
    if (endpoint?.browse?.id) {
      return KNOWN_ENDPOINT_ICONS[endpoint.browse.id] || 'fa fa-arrow-circle-right';
    }
    else if (endpoint?.watch_playlist) {
      return 'fa fa-play-circle';
    }

    return null;
  }

}

module.exports = EndpointItemParser;
