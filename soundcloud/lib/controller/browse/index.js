'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');
const Model = require(scPluginLibRoot + '/model');
const ViewHelper = require(scPluginLibRoot + '/helper/view');

class BrowseController {

    /* 
     *  uri follows a hierarchical view structure, starting with 'soundcloud'.
     * - If nothing follows 'soundcloud', the view would be 'root' (show root items)
     * 
     * After 'soundcloud', the uri consists of segments representing the following views:
     * - selections[@selectionId=...][@pageRef=...][@prevPageRefs=...]
     * - users[@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - playlists[@playlistId=...[@type=...]|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - albums[@albumId=...|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - tracks[@userId=...|@search=...|@topFeatured=1][@title=...][@pageRef=...][@prevPageRefs=...]
     * 
     */
    browseUri(uri) {
        sc.getLogger().info('[soundcloud-browse] browseUri(' + uri + ')');

        let defer = libQ.defer();

        ViewHandlerFactory.getHandler(uri).then( (handler) => {
            return handler.browse();
        }).then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
            sc.getLogger().error(error);
            defer.reject(error);
        });

        return defer.promise;
    }

    /**
     * Explodable uris:
     * - track[@trackId=...]
     * - playlists[@playlistId=...]
     * - albums[@albumId=...]
     * - users[@userId=...]
     * 
     */
    explodeUri(uri) {
        sc.getLogger().info('[soundcloud-browse] explodeUri(' + uri + ')');

        let defer = libQ.defer();

        ViewHandlerFactory.getHandler(uri).then( (handler) => {
            return handler.explode();
        }).then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
            sc.getLogger().error(error);
            defer.reject(error);
        });

        return defer.promise;
    }

    goto(data) {
        let gotoUri = libQ.resolve('soundcloud');
        let trackView = ViewHelper.getViewsFromUri(data.uri).pop();
        if (trackView && trackView.name === 'track' && trackView.trackId && (data.type === 'album' || data.type === 'artist')) {
            if (data.type === 'album' && trackView.fromPlaylistId) {
                gotoUri = libQ.resolve('soundcloud/playlists@playlistId=' + trackView.fromPlaylistId);
            }
            else if (data.type === 'album' && trackView.fromAlbumId) {
                gotoUri = libQ.resolve('soundcloud/albums@albumId=' + trackView.fromAlbumId);
            }
            else {
                let model = Model.getInstance('track');
                gotoUri = model.getTrack(trackView.trackId)
                    .then( track => track && track.user && track.user.id ? 'soundcloud/users@userId=' + track.user.id : 'soundcloud' );
            }
        }
        return gotoUri.then( uri => this.browseUri(uri) );
    }

}

module.exports = BrowseController;