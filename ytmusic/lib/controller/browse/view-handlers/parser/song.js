'use strict';

const BaseParser = require(__dirname + '/base');

class SongParser extends BaseParser {

  parseToListItem(data, opts) {
    opts = this._parseOpts(opts);
    const explodeTrackData = this.getExplodeTrackData(data, opts);
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
    item.uri += `@explodeTrackData=${encodeURIComponent(JSON.stringify(explodeTrackData))}`

    if (data.displayHint === 'grid') {
      item.artist = data.subtitle;
      delete item.album;
    }

    return item;
  }

  getItemUri(data) {
    return 'ytmusic/song@songId=' + encodeURIComponent(data.id);
  }

  // Creates a bundle that contains the data needed by explode() to 
  // generate the final exploded item.
  getExplodeTrackData(data, opts) {
    const track = {
      videoId: data.id,
      title: data.title,
      artist: data.artistText || data.subtitle,
      album: data.albumText,
      albumart: data.thumbnail?.url
    };
    if (opts.autoplayContext) {
      track.autoplayContext = opts.autoplayContext;
    }
    
    return track;
  }

  _parseOpts(opts = {}) {
    const result = {
      noAlbumart: false
    };
    if (opts.noAlbumart !== undefined) {
      result.noAlbumart = !!opts.noAlbumart;
    }
    if (opts.autoplayContext !== undefined) {
      result.autoplayContext = opts.autoplayContext;
    }
    return result;
  }
}

module.exports = SongParser;
