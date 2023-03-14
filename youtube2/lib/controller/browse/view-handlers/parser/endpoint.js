'use strict';

const EndpointHelper = require('../../../../helper/endpoint');
const BaseParser = require('./base');

const ICON_BY_BROWSE_ID = {
  // Keep this in case we need it in the future  
};

const ICON_BY_NAME = {
  'WHAT_TO_WATCH': 'fa fa-home',
  'SUBSCRIPTIONS': 'fa fa-th-large',
  'UNLIMITED': 'fa fa-film',
  'VIDEO_LIBRARY_WHITE': 'fa fa-youtube-play',
  'WATCH_HISTORY': 'fa fa-history',
  'WATCH_LATER': 'fa fa-clock-o',
  'LIKES_PLAYLIST': 'fa fa-heart',
  'PLAYLISTS': 'fa fa-list',
  'MIX': 'fa fa-random',
  'YT2_SHOWING_RESULTS_FOR': 'fa fa-info-circle' // Our own icon type
};

const VIEW_NAME_BY_BROWSE_ID = {
  'FEsubscriptions': 'subscriptions'
};

class EndpointItemParser extends BaseParser {

  parseToListItem(data) {
    if (!EndpointHelper.validate(data.endpoint)) {
      return null;
    }

    const baseUri = this.getUri();
    const item = {
      service: 'youtube2',
      // Setting type to 'album' is important for 'watch' endpoint items, as we
      // only want this item to be exploded and not others in the same list when
      // it is clicked.
      type: data.endpoint.type === 'watch' ? 'album' : 'youtube2EndpointItem',
      title: data.title,
    }

    if (data.subtitle) {
      item.artist = data.subtitle;
    }
    if (data.thumbnail) {
      item.albumart = data.thumbnail;
    }
    else {
      item.icon = this._getIcon(data);
    }

    const targetViewName = data.endpoint.type === 'search' ? 'search' : (VIEW_NAME_BY_BROWSE_ID[data.endpoint.payload.browseId] || 'generic');
    item.uri = baseUri + `/${targetViewName}@endpoint=` + encodeURIComponent(JSON.stringify(data.endpoint));

    return item;
  }

  _getIcon(data) {
    const iconByName = ICON_BY_NAME[data.icon];
    if (iconByName) {
      return iconByName;
    }

    const endpoint = data.endpoint;
    if (endpoint.type === 'browse') {
      return ICON_BY_BROWSE_ID[endpoint.payload.browseId] || 'fa fa-arrow-circle-right';
    }
    else if (endpoint.type === 'watch') {
      return 'fa fa-play-circle';
    }

    return null;
  }
}

module.exports = EndpointItemParser;
