'use strict';

const BaseParser = require('./base');

class ChannelParser extends BaseParser {

  parseToListItem(data) {
    const baseUri = this.getUri();
    const item = {
      service: 'youtube2',
      type: 'folder',
      title: data.name,
      artist: data.subscribers,
      albumart: data.thumbnail,
      uri: baseUri + '/generic@endpoint=' + encodeURIComponent(JSON.stringify(data.endpoint))
    }
    return item;
  }

  parseToHeader(data) {
    const header = {
      uri: 'youtube2/generic@endpoint=' + encodeURIComponent(JSON.stringify(data.endpoint)),
      service: 'youtube2',
      type: 'album',
      title: data.title,
      duration: data.subtitles?.join(' • '),
      albumart: data.thumbnail
    };

    if (data.description) {
      header.artist = data.description;
    }
    
    return header;
  }
}

module.exports = ChannelParser;
