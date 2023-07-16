'use strict';

const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');

class BaseModel {

  getInnerTube() {
    return ytmusic.get('innertube');
  }
}

module.exports = BaseModel;
