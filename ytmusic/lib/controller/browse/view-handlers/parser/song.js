'use strict';

const BaseParser = require(__dirname + '/base');

class SongParser extends BaseParser {

  parseToListItem(data, opts) {
    opts = this._parseOpts(opts);
    const explodeTrackData = this.getExplodeTrackData(data);
    const item = {
      service: 'ytmusic',
      type: 'song',
      tracknumber: data.trackNumber,
      title: explodeTrackData.title,
      artist: explodeTrackData.artist,
      album: explodeTrackData.album,
      albumart: !opts.noAlbumart ? explodeTrackData.albumart : null,
      duration: data.duration,
      uri: this.getItemUri(data)
    }
    item.uri = item.uri + `@explodeTrackData=${encodeURIComponent(JSON.stringify(explodeTrackData))}`
    return item;
  }

  getItemUri(data) {
    return 'ytmusic/song@songId=' + encodeURIComponent(data.id);
  }

  getExplodeTrackData(data) {
    return {
      videoId: data.id,
      title: data.title,
      artist: data.subtitle || data.artistText,
      album: data.albumText,
      albumart: data.thumbnail?.url
    };
  }

  _parseOpts(opts = {}) {
    const result = {
      noAlbumart: false
    };
    if (opts.noAlbumart !== undefined) {
      result.noAlbumart = !!opts.noAlbumart;
    }
    return result;
  }
}

module.exports = SongParser;
