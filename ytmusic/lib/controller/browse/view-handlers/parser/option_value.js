'use strict';

const BaseParser = require(__dirname + '/base');

const ENDPOINT_ACTION_TYPES = ['browse', 'search', 'continuation'];

class OptionValueParser extends BaseParser {

  parseToListItem(data, baseUri, prevUri, passback) {
    const view = this.getCurrentView();
    let valueUri;
    if (ENDPOINT_ACTION_TYPES.includes(data.endpoint?.actionType)) {
      const genericViewUri = view.genericViewUri ? decodeURIComponent(view.genericViewUri) : 'generic';
      valueUri = `${baseUri}/${genericViewUri}@endpoint=${encodeURIComponent(JSON.stringify(data.endpoint))}`;

      if (passback) {
        valueUri += `@${passback.name}=${encodeURIComponent(JSON.stringify(passback.data))}`;
      }
    }
    else if (data.selected) {
      valueUri = prevUri;
    }
    else {
      valueUri = baseUri;
    }

    const item = {
      service: 'ytmusic',
      type: 'ytmusicOption',
      title: data.label,
      icon: data.selected ? 'fa fa-check' : 'fa',
      uri: valueUri
    }

    return item;
  }
}

module.exports = OptionValueParser;
