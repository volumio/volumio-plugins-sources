'use strict';

const libQ = require('kew');
const BaseViewHandler = require(__dirname + '/base');
const TrackHelper = require(ytmusicPluginLibRoot + '/helper/track');

class ExplodableViewHandler extends BaseViewHandler {

  explode() {
    const view = this.getCurrentView();
    if (view.noExplode) {
      return libQ.resolve([]);
    }

    const defer = libQ.defer();

    this.getTracksOnExplode().then((tracks) => {
      const tracksToParse = !Array.isArray(tracks) ? [tracks] : tracks;
      defer.resolve(tracksToParse.map((track) => TrackHelper.parseTrackForExplode(track)));
    })
      .fail((error) => {
        defer.reject(error);
      })

    return defer.promise;
  }

  getTracksOnExplode() {
    return libQ.resolve([]);
  }
}

module.exports = ExplodableViewHandler;
