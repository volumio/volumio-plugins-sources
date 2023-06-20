'use strict';

const ExplodableViewHandler = require('./explodable');

class VideoViewHandler extends ExplodableViewHandler {
  
  async getTracksOnExplode() {
    const view = this.getCurrentView();
    if (!view.explodeTrackData) {
      throw Error("Operation not supported");
    }

    return JSON.parse(decodeURIComponent(view.explodeTrackData));
  }
}

module.exports = VideoViewHandler;
