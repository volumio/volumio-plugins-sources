'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const ViewHelper = require(ytmusicPluginLibRoot + '/helper/view');
const Model = require(ytmusicPluginLibRoot + '/model')
const Parser = require(__dirname + '/parser');

class BaseViewHandler {

  constructor(curView, prevViews) {
    this._curView = curView;
    this._prevViews = prevViews;
    this._models = {};
    this._parsers = {};
  }

  browse() {
    return libQ.resolve([]);
  }

  explode() {
    return libQ.reject("Operation not supported");
  }

  getUri() {
    if (!this._uri) {
      this._uri = this.constructCurrentUri();
    }
    return this._uri;
  }

  getCurrentView() {
    return this._curView;
  }

  getPreviousViews() {
    return this._prevViews;
  }

  getModel(type) {
    if (this._models[type] == undefined) {
      this._models[type] = Model.getInstance(type);
    }
    return this._models[type];
  }

  getParser(type) {
    if (this._parsers[type] == undefined) {
      this._parsers[type] = Parser.getInstance(type, this.getUri(), this.getCurrentView(), this.getPreviousViews());
    }
    return this._parsers[type];
  }

  constructUriFromViews(views) {
    const segments = [];

    views.forEach((view) => {
      segments.push(this._constructUriSegment(view));
    });

    return segments.join('/');
  }

  constructCurrentUri() {
    return this.constructUriFromViews(this.getPreviousViews().concat(this.getCurrentView()));
  }

  constructPrevUri() {
    const curView = this.getCurrentView();
    const prevViews = this.getPreviousViews();

    const segments = [];

    prevViews.forEach((view) => {
      segments.push(this._constructUriSegment(view));
    });

    const newView = {...curView};
    if (curView.prevContinuations) {
      const prevContinuations = JSON.parse(decodeURIComponent(curView.prevContinuations));
      const prevContinuation = Array.isArray(prevContinuations) ? prevContinuations.pop() : null;
      let newPrevContinuations;
      if (prevContinuation && prevContinuations.length > 0) {
        newPrevContinuations = encodeURIComponent(JSON.stringify(prevContinuations));
      }
      else {
        newPrevContinuations = null;
      }
      if (newPrevContinuations) {
        newView.prevContinuations = newPrevContinuations;
        segments.push(this._constructUriSegment(newView));
      }
      else {
        delete newView.continuationBundle;
        segments.push(this._constructUriSegment(newView));
      }
    } else if (curView.continuation) {
      delete newView.continuation;
      segments.push(this._constructUriSegment(newView));
    }

    return segments.join('/') || '/';
  }

  _constructContinuationUri(continuation, bundle) {
    const curView = this.getCurrentView();
    const prevViews = this.getPreviousViews();

    const segments = [];

    prevViews.forEach((view) => {
      segments.push(this._constructUriSegment(view));
    });

    const newView = {
      ...curView,
      continuation: encodeURIComponent(JSON.stringify(continuation))
    };

    const prevContinuations = curView.prevContinuations ? JSON.parse(decodeURIComponent(curView.prevContinuations)) : [];
    if (curView.continuation) {
      prevContinuations.push(JSON.parse(decodeURIComponent(curView.continuation)));
    }
    if (prevContinuations.length > 0) {
      newView.prevContinuations = encodeURIComponent(JSON.stringify(prevContinuations));
    }
    else {
      delete newView.prevContinuations;
    }

    if (!newView.continuationBundle && bundle) {
      newView.continuationBundle = encodeURIComponent(JSON.stringify(bundle));
    }

    segments.push(this._constructUriSegment(newView));

    return segments.join('/');
  }

  _constructUriSegment(view) {

    let segment;
    if (view.name === 'root') {
      segment = 'ytmusic';
    }
    else {
      segment = view.name;
    }

    const skip = ['name', 'noExplode'];
    Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
      const v = view[key] !== null ? view[key] : ViewHelper.NULL_VALUE_PLACEHOLDER;
      segment += '@' + key + '=' + v;
    });

    return segment;
  }

  constructContinuationItem(continuation, bundle) {
    /**
     * continuation: {
     *  token:  // continuation token
     *  prevItemCount:  // number of items shown so far
     * }
     */

    if (typeof continuation === 'string') {
      continuation = {
        token: continuation
      };
    }

    const data = {
      service: 'ytmusic',
      type: 'ytmusicNextPageItem',
      'title': ytmusic.getI18n('YTMUSIC_MORE'),
      'uri': this._constructContinuationUri(continuation, bundle) + '@noExplode=1',
      'icon': 'fa fa-arrow-circle-right'
    }
    return data;
  }

  constructUriWithParams(params) {
    const prevViews = this.getPreviousViews();
    const curView = Object.assign({}, this.getCurrentView(), params);

    return this.constructUriFromViews(prevViews.concat(curView));
  }
}

module.exports = BaseViewHandler
