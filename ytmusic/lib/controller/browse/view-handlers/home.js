'use strict';

const FeedViewHandler = require(__dirname + '/feed');

class HomeViewHandler extends FeedViewHandler {

  async getContents() {
    const model = this.getModel('home');
    return model.getFeed();
  }
}

module.exports = HomeViewHandler;
