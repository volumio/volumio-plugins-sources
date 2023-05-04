'use strict';

const BaseParser = require('./base');

class PlaylistParser extends BaseParser {

  parseToListItem(data) {
    const baseUri = this.getUri();
    const item = {
      service: 'youtube2',
      type: 'folder',
      title: data.title,
      albumart: data.thumbnail
    };

    const subtitles = [];
    if (data.author?.name) {
      subtitles.push(data.author.name);
    }
    if (data.videoCount) {
      subtitles.push(data.videoCount);
    }
    item.artist = subtitles.join(' • ');

    const endpoints = {
      watch: data.endpoint
    };

    if (data.browseEndpoint) {
      endpoints.browse = data.browseEndpoint;
    }
    else {
      // `CompactStations` converted to playlists do not have browseEndpoints and are to be played 
      // directly when clicked, i.e. they are not browseable.
      item.type = 'album';
    }

    item.uri = baseUri + '/playlist@endpoints=' + encodeURIComponent(JSON.stringify(endpoints));

    return item;
  }

  parseToHeader(data) {
    const header = {
      uri: 'youtube2/generic@endpoint=' + encodeURIComponent(JSON.stringify(data.endpoint)),
      service: 'youtube2',
      type: 'playlist',
      title: data.title,
      artist: data.author?.name,
      duration: data.subtitles?.join(' • '),
      albumart: data.thumbnail
    };

    return header;
  }

}

module.exports = PlaylistParser;
