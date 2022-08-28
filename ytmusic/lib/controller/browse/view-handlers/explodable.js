'use strict';

const libQ = require('kew');
const BaseViewHandler = require(__dirname + '/base');

class ExplodableViewHandler extends BaseViewHandler {

  explode() {
    const view = this.getCurrentView();
    if (view.noExplode) {
      return libQ.resolve([]);
    }

    const defer = libQ.defer();

    this.getTracksOnExplode().then((tracks) => {
      const tracksToParse = !Array.isArray(tracks) ? [tracks] : tracks;
      defer.resolve(tracksToParse.map((track) => this._parseTrackForExplode(track)));
    })
      .fail((error) => {
        defer.reject(error);
      })

    return defer.promise;
  }

  getTracksOnExplode() {
    return libQ.resolve([]);
  }

  _parseTrackForExplode(track) {
    return {
      'service': 'ytmusic',
      'uri': this._getTrackUri(track),
      'albumart': track.albumart,
      'artist': track.artist,
      'album': track.album,
      'name': track.title,
      'title': track.title
    };
  }

  /**
   * Track uri:
   * ytmusic/video@videoId={...}@explodeTrackData={...}
   */
  _getTrackUri(track) {
    const parts = [
      'ytmusic/video',
      `videoId=${encodeURIComponent(track.videoId)}`,
      // explodeTrackData - necessary because Volumio adds track uri in 
      // its own playlist / favorites / Last 100, and explodes them again when
      // played.
      `explodeTrackData=${encodeURIComponent(JSON.stringify(track))}`
    ];
    return parts.join('@');
  }
}

module.exports = ExplodableViewHandler;
