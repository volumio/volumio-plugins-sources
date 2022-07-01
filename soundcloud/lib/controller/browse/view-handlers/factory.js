'use strict';

const libQ = require('kew');
const RootViewHandler = require(__dirname + '/root');
const SelectionViewHandler = require(__dirname + '/selection');
const UserViewHandler = require(__dirname + '/user');
const PlaylistViewHandler = require(__dirname + '/playlist');
const AlbumViewHandler = require(__dirname + '/album');
const TrackViewHandler = require(__dirname + '/track');
const ViewHelper = require(scPluginLibRoot + '/helper/view');

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
    'selections': SelectionViewHandler,
    'users': UserViewHandler,
    'albums': AlbumViewHandler,
    'playlists': PlaylistViewHandler,
    'tracks': TrackViewHandler,
    'track': TrackViewHandler,

}

module.exports = ViewHandlerFactory;