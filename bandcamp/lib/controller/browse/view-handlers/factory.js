'use strict';

const ViewHelper = require(bandcampPluginLibRoot + '/helper/view');
const RootViewHandler = require(__dirname + '/root');
const DiscoverViewHandler = require(__dirname + '/discover');
const BandViewHander = require(__dirname + '/band');
const AlbumViewHandler = require(__dirname + '/album');
const TrackViewHandler = require(__dirname + '/track');
const SearchViewHandler = require(__dirname + '/search');
const ShowViewHandler = require(__dirname + '/show');
const ArticleViewHandler = require(__dirname + '/article');
const TagViewHandler = require(__dirname + '/tag');
const FanViewHandler = require(__dirname + '/fan');

class ViewHandlerFactory {

    static getHandler(uri) {
        let self = this;

        let views = ViewHelper.getViewsFromUri(uri);
        let curView = views.pop();
        let prevViews = views;

        // 'artist' and 'label' views are obsolete (replaced by single 'band' view), 
        // but may still exist in Volumio playlists or favourites. We still want to be able
        // to play them, so we translate these URIs into their 'band' equivalent.
        if (curView.name === 'artist' || curView.name === 'label') {
            curView.name = 'band';

            if (curView.artistUrl) {
                curView.bandUrl = curView.artistUrl;
                delete curView.artistUrl;
            }

            if (curView.labelUrl) {
                curView.bandUrl = curView.labelUrl;
                delete curView.labelUrl;
            }
        }

        return new self._viewToClass[curView.name](uri, curView, prevViews);
    }
}

ViewHandlerFactory._viewToClass = {
    'root': RootViewHandler,
    'discover': DiscoverViewHandler,
    'band': BandViewHander,
    'album': AlbumViewHandler,
    'track': TrackViewHandler,
    'search': SearchViewHandler,
    'shows': ShowViewHandler,
    'articles': ArticleViewHandler,
    'tag': TagViewHandler,
    'fan': FanViewHandler
}

module.exports = ViewHandlerFactory;