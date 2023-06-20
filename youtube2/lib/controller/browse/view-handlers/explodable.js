'use strict';

const BaseViewHandler = require('./base');
const TrackHelper = require('../../../helper/track');

class ExplodableViewHandler extends BaseViewHandler {

  async explode() {
    const view = this.getCurrentView();
    if (view.noExplode) {
      return [];
    }

    const tracks = await this.getTracksOnExplode();
    const tracksToParse = !Array.isArray(tracks) ? [tracks] : tracks;
    
    return tracksToParse.map((track) => TrackHelper.parseToQueueItem(track));
  }

  async getTracksOnExplode() {
    return [];
  }
}

module.exports = ExplodableViewHandler;
