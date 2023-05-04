'use strict';

const BaseParser = require(__dirname + '/base');

const EXCLUDE_VIEW_PARAMS = ['name', 'continuation', 'endpoint'];

class OptionParser extends BaseParser {

  parseToListItem(data, opts) {
    const selected = data.optionValues.find((ov) => ov.selected) || data.optionValues[0];
    const baseUri = this.getUri();
    
    const view = this.getCurrentView();
    const keys = Object.keys(view).filter((param) => !EXCLUDE_VIEW_PARAMS.includes(param));
    const genericViewUri = keys.reduce((uri, key) => `${uri}@${key}=${view[key]}`, view.name);

    const item = {
      service: 'ytmusic',
      type: 'ytmusicOption',
      title: selected.label,
      icon: 'fa fa-angle-down',
      uri: baseUri + `/optionSelection@option=${encodeURIComponent(JSON.stringify(data))}@genericViewUri=${encodeURIComponent(genericViewUri)}`
    }

    if (opts?.passback) {
      // Data to be passed back with option value selection
      item.uri += `@passback=${encodeURIComponent(JSON.stringify(opts.passback))}`;
    }

    return item;
  }
}

module.exports = OptionParser;
