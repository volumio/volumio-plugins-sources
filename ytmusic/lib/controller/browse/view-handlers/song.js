'use strict';

const libQ = require('kew');
const ExplodableViewHandler = require(__dirname + '/explodable');

class SongViewHandler extends ExplodableViewHandler {

  getTracksOnExplode() {
    const view = this.getCurrentView();
    if (!view.explodeTrackData) {
      return libQ.reject("Operation not supported");
    }

    return libQ.resolve(JSON.parse(decodeURIComponent(view.explodeTrackData)));
  }
}

module.exports = SongViewHandler;
