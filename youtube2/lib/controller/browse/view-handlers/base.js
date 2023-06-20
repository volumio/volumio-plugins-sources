'use strict';

const yt2 = require('../../../youtube2');
const Parser = require('./parser');
const Model = require('../../../model');
const ViewHelper = require('../../../helper/view');

class BaseViewHandler {

  constructor(curView, prevViews) {
    this._curView = curView;
    this._prevViews = prevViews;
    this._models = {};
    this._parsers = {};
  }

  async browse() {
    return [];
  }

  async explode() {
    throw Error("Operation not supported");
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

  constructCurrentUri() {
    return ViewHelper.constructUriFromViews(this.getPreviousViews().concat(this.getCurrentView()));
  }

  constructPrevUri() {
    return ViewHelper.constructPrevUri(this.getCurrentView(), this.getPreviousViews());
  }

  _constructContinuationUri(continuationData) {
    const { endpoint, prevItemCount, bundle } = continuationData;

    const curView = this.getCurrentView();
    const prevViews = this.getPreviousViews();

    const segments = [];

    prevViews.forEach((view) => {
      segments.push(ViewHelper.constructUriSegment(view));
    });

    const newView = {
      ...curView,
      continuation: encodeURIComponent(JSON.stringify({ endpoint, prevItemCount }))
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

    segments.push(ViewHelper.constructUriSegment(newView));

    return segments.join('/');
  }

  constructContinuationItem(continuationData) {
    //  continuationData: {
    //    continuation: same as returned by model/InnerTubeParser#parseResult()
    //    prevItemCount
    //    continuationBundle
    //  }

    const { continuation, prevItemCount, continuationBundle: bundle } = continuationData;

    const data = {
      service: 'youtube2',
      type: 'youtube2NextPageItem',
      'title': continuation.text || yt2.getI18n('YOUTUBE2_MORE'),
      'uri': this._constructContinuationUri({ endpoint: continuation.endpoint, prevItemCount, bundle }) + '@noExplode=1',
      'icon': 'fa fa-arrow-circle-right'
    }
    return data;
  }

  constructUriWithParams(params) {
    const prevViews = this.getPreviousViews();
    const curView = Object.assign({}, this.getCurrentView(), params);

    return ViewHelper.constructUriFromViews(prevViews.concat(curView));
  }
}

module.exports = BaseViewHandler;
