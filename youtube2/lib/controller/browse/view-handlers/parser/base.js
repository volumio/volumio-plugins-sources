'use strict';

class BaseParser {

  constructor(uri, curView, prevViews) {
    this._uri = uri;
    this._curView = curView;
    this._prevViews = prevViews;
  }

  parseToListItem(item) {
    return null;
  }

  parseToHeader(item) {
    return null;
  }

  getUri() {
    return this._uri;
  }

  getCurrentView() {
    return this._curView;
  }

  getPreviousViews() {
    return this._prevViews;
  }
}

module.exports = BaseParser;
