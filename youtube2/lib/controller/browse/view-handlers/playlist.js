'use strict';

const GenericViewHandler = require('./generic');

class PlaylistViewHandler extends GenericViewHandler {

  // Override
  async getContents() {
    const endpoint = this.getEndpoint();
    const model = this.getModel('playlist');
    return model.getContents(endpoint);
  }

  // Override
  getEndpoint(explode = false) {
    const view = this.getCurrentView();
    if (!view.continuation) {
      const endpoints = JSON.parse(decodeURIComponent(view.endpoints));
      return (explode ? endpoints.watch : endpoints.browse) || null;
    }
    return super.getEndpoint();
  }
}

module.exports = PlaylistViewHandler;
