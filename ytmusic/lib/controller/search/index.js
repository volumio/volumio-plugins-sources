'use strict';

const ViewHandlerFactory = require(ytmusicPluginLibRoot + '/controller/browse/view-handlers/factory');

class SearchController {

  search(query) {
    const searchUri = `ytmusic/search@query=${encodeURIComponent(query.value)}`;
    const handler = ViewHandlerFactory.getHandler(searchUri);

    return handler.browse().then((results) => {
      return results.navigation.lists;
    });
  }
}

module.exports = SearchController;
