'use strict';

const Parser = require('volumio-youtubei.js').Parser;
const { InnerTubeParser } = require('./innertube');
const EndpointModel = require(__dirname + '/endpoint');

const HISTORY_ENDPOINT = {
  actionType: 'browse',
  payload: {
    browseId: 'FEmusic_history'
  }
};

class HistoryModel extends EndpointModel {

  async getHistory() {
    return this.getContents(HISTORY_ENDPOINT);
  }
}

module.exports = HistoryModel;
