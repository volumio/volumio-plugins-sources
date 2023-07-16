'use strict';

const HomeModel = require(__dirname + '/home');

class ExploreModel extends HomeModel {

  async _innerTubeGetFeed() {
    const innerTube = this.getInnerTube();
    return innerTube.music.getExplore();
  }
}

module.exports = ExploreModel;
