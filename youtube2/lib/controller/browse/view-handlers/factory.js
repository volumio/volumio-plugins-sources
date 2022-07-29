'use strict';

const libQ = require('kew');
const RootViewHandler = require(__dirname + '/root');
const ChannelViewHandler = require(__dirname + '/channel');
const PlaylistViewHandler = require(__dirname + '/playlist');
const VideoViewHandler = require(__dirname + '/video');
const ViewHelper = require(yt2PluginLibRoot + '/helper/view');

class ViewHandlerFactory {

    static getHandler(uri) {
        let views = ViewHelper.getViewsFromUri(uri);
        let curView = views.pop();
        let prevViews = views;

        let handler = new this._viewToClass[curView.name](curView, prevViews);

        return libQ.resolve(handler);
    }
}

ViewHandlerFactory._viewToClass = {
    'root': RootViewHandler,
    'channels': ChannelViewHandler,
    'playlists': PlaylistViewHandler,
    'videos': VideoViewHandler,
    'video': VideoViewHandler,

}

module.exports = ViewHandlerFactory;