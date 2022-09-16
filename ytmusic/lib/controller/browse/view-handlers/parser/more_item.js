'use strict';

const EndpointItemParser = require(__dirname + '/endpoint');

class MoreItemParser extends EndpointItemParser {

  parseToListItem(data, bundle) {
    const item = super.parseToListItem(data);
    if (item && bundle) {
      item.uri += `@moreContentBundle=${encodeURIComponent(JSON.stringify(bundle))}`;
    }

    return item;
  }

  getUriFromEndpoint(endpoint) {
    const uri = super.getUriFromEndpoint(endpoint);
    return uri + '@noExplode=1';
  }

  getIconFromEndpoint(endpoint) {
    return 'fa fa-arrow-circle-right';
  }
}

module.exports = MoreItemParser;
