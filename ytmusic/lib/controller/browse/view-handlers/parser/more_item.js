'use strict';

const EndpointItemParser = require(__dirname + '/endpoint');

class MoreItemParser extends EndpointItemParser {

  #ignorePageType;

  parseToListItem(data, bundle) {
    const item = super.parseToListItem(data);
    if (item && bundle && this.#ignorePageType) {
      item.uri += `@moreContentBundle=${encodeURIComponent(JSON.stringify(bundle))}`;
    }

    return item;
  }

  getUriFromEndpoint(endpoint) {
    this.#ignorePageType = (endpoint.actionType === 'browse' && endpoint.payload.params) || endpoint.actionType === 'search';
    const uri = super.getUriFromEndpoint(endpoint, this.#ignorePageType);
    return uri + '@noExplode=1';
  }

  getIconFromEndpoint(endpoint) {
    return 'fa fa-arrow-circle-right';
  }
}

module.exports = MoreItemParser;
