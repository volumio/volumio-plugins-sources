'use strict';

const ViewHelper = require(ytmusicPluginLibRoot + '/helper/view');
const HomeViewHandler = require(__dirname + '/home');
const AlbumViewHandler = require(__dirname + '/album');
const ArtistViewHandler = require(__dirname + '/artist');
const SongViewHandler = require(__dirname + '/song');
const VideoViewHandler = require(__dirname + '/video');
const PlaylistViewHandler = require(__dirname + '/playlist');
const GenericViewHandler = require(__dirname + '/generic');
const ExploreViewHandler = require(__dirname + '/explore');
const RootViewHandler = require(__dirname + '/root');
const LibraryViewHandler = require(__dirname + '/library');
const OptionSelectionViewHandler = require(__dirname + '/option_select');
const SearchViewHandler = require(__dirname + '/search');
const RecapViewHandler = require(__dirname + '/recap');

class ViewHandlerFactory {

  static getHandler(uri) {
    const views = ViewHelper.getViewsFromUri(uri);
    const curView = views.pop();
    const prevViews = views;
    return new this._viewToClass[curView.name](curView, prevViews);
  }
}

ViewHandlerFactory._viewToClass = {
  'home': HomeViewHandler,
  'album': AlbumViewHandler,
  'artist': ArtistViewHandler,
  'song': SongViewHandler,
  'video': VideoViewHandler,
  'playlist': PlaylistViewHandler,
  'generic': GenericViewHandler,
  'explore': ExploreViewHandler,
  'root': RootViewHandler,
  'library': LibraryViewHandler,
  'optionSelection': OptionSelectionViewHandler,
  'search': SearchViewHandler,
  'recap': RecapViewHandler
}

module.exports = ViewHandlerFactory;
