'use strict';

const libQ = require('kew');
const ViewHandlerFactory = require('../browse/view-handlers/factory');

class SearchController {

  search(query) {
    const defer = libQ.defer();

    const searchUri = `youtube2/search@query=${encodeURIComponent(query.value)}`;
    const handler = ViewHandlerFactory.getHandler(searchUri);

    handler.browse().then((results) => {
      defer.resolve(results.navigation.lists);
    })
    .catch((error) => {
      defer.reject(error);
    });

    return defer.promise;
  }
}

module.exports = SearchController;
