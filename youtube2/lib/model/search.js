'use strict';

const EndpointModel = require('./endpoint');

class SearchModel extends EndpointModel {

  async getSearchResultsByQuery(query) {
    const endpoint = {
      type: 'search',
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
