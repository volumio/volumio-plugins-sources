'use strict';

const libQ = require('kew');

const FeedViewHandler = require(__dirname + '/feed');

/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */

class GenericViewHandler extends FeedViewHandler {

  async getContents() {
    const view = this.getCurrentView();
    const endpoint = this._getEndpoint();

    if (!endpoint) {
      throw new Error('Endpoint missing or invalid');
    }

    const model = this.getModel('endpoint');
    return model.getContents(endpoint, {
      continuation: view.continuation ? JSON.parse(decodeURIComponent(view.continuation)) : null
    });
  }

  getTracksOnExplode() {
    const endpoint =  this._getEndpoint();

    if (endpoint?.actionType !== 'watchPlaylist') {
      return libQ.reject("Operation not supported");
    }

    const defer = libQ.defer();
    const model = this.getModel('endpoint');
    model.getContents(endpoint).then((contents) => {
      defer.resolve(this.getTracksOnExplodeFromSection(contents));
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  _getEndpoint() {
    const view = this.getCurrentView();
    try {
      return view.endpoint ? JSON.parse(decodeURIComponent(view.endpoint)) : null;
    } catch(error) {
      return null;
    }
  }
}

module.exports = GenericViewHandler;
