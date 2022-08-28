'use strict';

const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const BaseParser = require(__dirname + '/base');

class PlaylistParser extends BaseParser {

  parseToListItem(data) {
    const baseUri = this.getUri();
    const item = {
      service: 'ytmusic',
      type: 'folder',
      title: data.title,
      artist: data.subtitle || data.artistText,
      albumart: data.thumbnail?.url,
      uri: baseUri + '/playlist@playlistId=' + encodeURIComponent(data.id)
    }
    return item;
  }

  parseToHeader(data) {
    const view = this.getCurrentView();
    const header = {
      uri: 'ytmusic/playlist@playlistId=' + encodeURIComponent(data.id),
      service: 'ytmusic',
      type: 'album',
      title: data.title,
      artist: data.subtitle || data.artistText,
      albumart: data.thumbnail?.url
    };

    const durationParts = [];
    if (data.songCount) {
      durationParts.push(data.songCount);
    }
    if (data.totalDuration) {
      durationParts.push(data.totalDuration);
    }
    if (durationParts.length > 0) {
      header.duration = durationParts.join(' • ');
    }
    
    return header;
  }
}

module.exports = PlaylistParser;
