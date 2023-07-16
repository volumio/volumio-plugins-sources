'use strict';

const BaseParser = require(__dirname + '/base');

class ArtistParser extends BaseParser {

  parseToListItem(data) {
    const baseUri = this.getUri();
    const item = {
      service: 'ytmusic',
      type: 'folder',
      title: data.name,
      artist: data.subtitle,
      albumart: data.thumbnail?.url,
      uri: baseUri + '/artist@artistId=' + encodeURIComponent(data.id)
    }
    return item;
  }

  parseToHeader(data) {
    const header = {
      uri: 'ytmusic/artist@artistId=' + encodeURIComponent(data.id),
      service: 'ytmusic',
      type: 'album',
      title: data.name,
      artist: data.description,
      albumart: data.thumbnail?.url,
    };
    return header;
  }
}

module.exports = ArtistParser;
