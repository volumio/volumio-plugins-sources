'use strict';

const BaseParser = require(__dirname + '/base');

class OptionValueParser extends BaseParser {

  parseToListItem(data, baseUri, prevUri) {
    const view = this.getCurrentView();
    let valueUri;
    if (data.endpoint?.browse || data.endpoint?.search) {
      const genericViewUri = view.genericViewUri ? decodeURIComponent(view.genericViewUri ) : 'generic';
      valueUri = `${baseUri}/${genericViewUri}@endpoint=${encodeURIComponent(JSON.stringify(data.endpoint))}`;
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
