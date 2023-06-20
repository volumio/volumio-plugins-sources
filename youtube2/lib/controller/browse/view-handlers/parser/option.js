'use strict';

const BaseParser = require('./base');

const EXCLUDE_VIEW_PARAMS = ['name', 'continuation', 'endpoint', 'continuationBundle'];

class OptionParser extends BaseParser {

  parseToListItem(data) {
    if (data.fromContinuationBundle) {
      return this._parseFromContinuationBundle(data);
    }

    const selected = data.optionValues.find((ov) => ov.selected) || data.optionValues[0];
    const baseUri = this.getUri();
    
    const view = this.getCurrentView();
    const keys = Object.keys(view).filter((param) => !EXCLUDE_VIEW_PARAMS.includes(param));
    const genericViewUri = keys.reduce((uri, key) => `${uri}@${key}=${view[key]}`, view.name);

    const item = {
      service: 'youtube2',
      type: 'youtube2Option',
      title: selected.text,
      icon: 'fa fa-angle-down',
      uri: baseUri + `/optionSelection@option=${encodeURIComponent(JSON.stringify(data))}@genericViewUri=${encodeURIComponent(genericViewUri)}`
    };

    return item;
  }

  _parseFromContinuationBundle(data) {
    const { continuationBundle: bundle, target } = data;
    const targetKeys = target.split('.');
    const option = targetKeys.reduce((targetValue, key) => targetValue[key], bundle);
    const selected = option.optionValues.find((ov) => ov.selected) || null;
    const displayText = selected ? (option.title ? option.title + ': ' + selected.text : selected.text) : (option.title || data.optionValues[0].text);

    const view = this.getCurrentView();
    const baseUri = this.getUri();
    const keys = Object.keys(view).filter((param) => !EXCLUDE_VIEW_PARAMS.includes(param));
    const genericViewUri = keys.reduce((uri, key) => `${uri}@${key}=${view[key]}`, view.name);

    const uriParams = [
      `fromContinuationBundle=1`,
      `continuationBundle=${encodeURIComponent(JSON.stringify(bundle))}`,
      `target=${encodeURIComponent(target)}`,
      `genericViewUri=${encodeURIComponent(genericViewUri)}`
    ];

    const item = {
      service: 'youtube2',
      type: 'youtube2Option',
      title: displayText,
      icon: 'fa fa-angle-down',
      uri: baseUri + `/optionSelection@` + uriParams.join('@')
    };

    return item;
  }
}

module.exports = OptionParser;
