'use strict';

const ViewHelper = require('../../../helper/view');
const GenericViewHandler = require('./generic');
const OptionSelectionViewHandler = require('./option_select');
const PlaylistViewHandler = require('./playlist');
const RootViewHandler = require('./root');
const SearchViewHandler = require('./search');
const VideoViewHandler = require('./video');
const SubscriptionsViewHandler = require('./subscriptions');

class ViewHandlerFactory {

  static getHandler(uri) {
    const views = ViewHelper.getViewsFromUri(uri);
    const curView = views.pop();
    const prevViews = views;
    return new this._viewToClass[curView.name](curView, prevViews);
  }
}

ViewHandlerFactory._viewToClass = {
  'root': RootViewHandler,
  'generic': GenericViewHandler,
  'video': VideoViewHandler,
  'playlist': PlaylistViewHandler,
  'optionSelection': OptionSelectionViewHandler,
  'search': SearchViewHandler,
  'subscriptions': SubscriptionsViewHandler
};

module.exports = ViewHandlerFactory;
