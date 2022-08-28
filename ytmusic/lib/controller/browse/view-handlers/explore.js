'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const FeedViewHandler = require(__dirname + '/feed');

class ExploreViewHandler extends FeedViewHandler {

  browse() {
    const defer = libQ.defer();

    super.browse().then((result) => {
      // Force top section containing endpoint items for 
      // 'New releases', 'Charts'... to grid + list views
      const list = result.navigation.lists?.[0];
      if (list) {
        list.availableListViews = ['grid', 'list'];
        list.title = list.title || ytmusic.getI18n('YTMUSIC_EXPLORE');
      }

      defer.resolve(result);
    })
      .fail((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  async getContents() {
    const model = this.getModel('explore');
    this._feed = await model.getFeed();
    return this._feed;
  }
}

module.exports = ExploreViewHandler;
