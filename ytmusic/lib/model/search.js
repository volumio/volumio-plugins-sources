'use strict';

const EndpointModel = require(__dirname + '/endpoint');

class SearchModel extends EndpointModel {

  async getSearchResultsByQuery(query) {
    const endpoint = {
      actionType: 'search',
      payload: {
        query
      }
    };
    return this.getSearchResultsByEndpoint(endpoint);
  }

  async getSearchResultsByEndpoint(endpoint, opts) {
    return this.getContents(endpoint, opts);
  }
}

module.exports = SearchModel;
