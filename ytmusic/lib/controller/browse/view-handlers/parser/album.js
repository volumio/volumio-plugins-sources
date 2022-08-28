'use strict';

const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const BaseParser = require(__dirname + '/base');

class AlbumParser extends BaseParser {

  parseToListItem(data) {
    const baseUri = this.getUri();
    const item = {
      service: 'ytmusic',
      type: 'folder',
      title: data.title,
      artist: data.subtitle || data.artistText,
      albumart: data.thumbnail?.url,
      uri: baseUri + '/album@albumId=' + encodeURIComponent(data.id)
    }
    return item;
  }

  parseToMoreFromArtistItem(artist) {
    const baseUri = this.getUri();
    const artistName = artist?.name;
    const artistId = artist?.id;
    if (!artistName || !artistId) {
      return null;
    }
    const item = {
      service: 'ytmusic',
      type: 'ytmusicMoreFromItem',
      title: ytmusic.getI18n('YTMUSIC_MORE_FROM', artistName),
      icon: 'fa fa-arrow-right',
      uri: baseUri + '/artist@artistId=' + encodeURIComponent(artistId)
    };
    return item;
  }

  parseToHeader(data) {
    const header = {
      uri: 'ytmusic/album@albumId=' + encodeURIComponent(data.id),
      service: 'ytmusic',
      type: 'album',
      title: data.title,
      artist: data.artistText || data.subtitle,
      duration: data.songCount ? (data.songCount + ' • ' + data.totalDuration) : data.totalDuration,
      albumart: data.thumbnail?.url
    };
    return header;
  }
}

module.exports = AlbumParser;
