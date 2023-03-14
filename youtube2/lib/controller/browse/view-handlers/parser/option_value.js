'use strict';

const ViewHelper = require('../../../../helper/view');
const BaseParser = require('./base');

const ENDPOINT_TYPES = ['browse', 'search', 'browseContinuation', 'searchContinuation'];

class OptionValueParser extends BaseParser {

  #baseUri
  #prevUri

  parseToListItem(data, opts) {
    const view = this.getCurrentView();
    const baseUri = this._getBaseUri();
    const prevUri = this._getPrevUri();

    let valueUri;
    if (ENDPOINT_TYPES.includes(data.endpoint?.type)) {
      const genericViewUri = view.genericViewUri ? decodeURIComponent(view.genericViewUri) : 'generic';
      valueUri = `${baseUri}/${genericViewUri}@endpoint=${encodeURIComponent(JSON.stringify(data.endpoint))}`;

      if (opts?.extraUriParams) {
        const uriParamsArray = [];
        for (const [key, value] of Object.entries(opts.extraUriParams)) {
          uriParamsArray.push(`${key}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : value)}`);
        }
        if (uriParamsArray.length > 0) {
          valueUri += '@' + uriParamsArray.join('@');
        }
      }
    }
    else if (data.selected) {
      valueUri = prevUri;
    }
    else {
      valueUri = baseUri;
    }

    const item = {
      service: 'youtube2',
      type: 'youtube2Option',
      title: data.text,
      icon: data.selected ? 'fa fa-check' : 'fa',
      uri: valueUri
    }

    return item;
  }

  _getBaseUri() {
    if (!this.#baseUri) {
      const baseUriViews = [...this.getPreviousViews()];
      baseUriViews.pop();
      this.#baseUri = ViewHelper.constructUriFromViews(baseUriViews) || 'youtube2';
    }
    return this.#baseUri;
  }

  _getPrevUri() {
    if (!this.#prevUri) {
      this.#prevUri = ViewHelper.constructPrevUri(this.getCurrentView(), this.getPreviousViews());
    }
    return this.#prevUri;
  }
}

module.exports = OptionValueParser;
