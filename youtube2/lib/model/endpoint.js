'use strict';

const Parser = require('volumio-youtubei.js').Parser;
const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');

class EndpointModel extends InnerTubeBaseModel {

  async getContents(endpoint) {
    const innerTube = this.getInnerTube();
    
    let url;
    switch(endpoint?.type) {
      case 'browse':
      case 'browseContinuation':
        url = '/browse';
        break;
      case 'watch':
        url = '/next';
        break;
      case 'search':
      case 'searchContinuation':
        url = '/search';
        break;

      default:
    }

    if (url) {
      const response = await innerTube.actions.execute(url, endpoint.payload);
      const parsed = Parser.parseResponse(response.data); // First parse by InnerTube
      return InnerTubeParser.parseResult(parsed, endpoint); // Second parse
    }

    return null;
  }
}

module.exports = EndpointModel;
