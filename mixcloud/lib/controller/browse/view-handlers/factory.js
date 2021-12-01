'use strict';

const ViewHelper = require(mixcloudPluginLibRoot + '/helper/view');
const RootViewHandler = require(__dirname + '/root');
const DiscoverViewHandler = require(__dirname + '/discover');
const FeaturedViewHandler = require(__dirname + '/featured');
const CloudcastViewHandler = require(__dirname + '/cloudcast');
const PlaylistViewHandler = require(__dirname + '/playlist');
const UserViewHandler = require(__dirname + '/user');
const TagViewHandler = require(__dirname + '/tag');

class ViewHandlerFactory {

    static getHandler(uri) {
        let self = this;

        let views = ViewHelper.getViewsFromUri(uri);
        let curView = views.pop();
        let prevViews = views;
        return new self._viewToClass[curView.name](curView, prevViews);
    }
}

ViewHandlerFactory._viewToClass = {
    'root': RootViewHandler,
    'discover': DiscoverViewHandler,
    'featured': FeaturedViewHandler,
    'cloudcast': CloudcastViewHandler,
    'cloudcasts': CloudcastViewHandler,
    'playlist': PlaylistViewHandler,
    'playlists': PlaylistViewHandler,
    'user': UserViewHandler,
    'users': UserViewHandler,
    'tags': TagViewHandler
}

module.exports = ViewHandlerFactory;