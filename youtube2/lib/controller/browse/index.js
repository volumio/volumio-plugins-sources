'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');
const ViewHelper = require(yt2PluginLibRoot + '/helper/view');
const Model = require(yt2PluginLibRoot + '/model');

class BrowseController {

    /* 
     *  uri follows a hierarchical view structure, starting with 'youtube2'.
     * - If nothing follows 'youtube2', the view would be 'root' (show root items)
     * 
     * After 'youtube2', the uri consists of segments representing the following views:
     * - channels[@search=...][@title=...][@pageRef=...][@prevPageRefs=...]: show channels. If search ommitted, show channels subscribed by user
     * - playlists[@channelId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]: show playlists. If channelId or search term not specified, show user playlists
     * - videos[@playlistId=...|@search=...|@liked=...][@title=...][@pageRef=...][@prevPageRefs=...]: show videos
     * 
     */
    browseUri(uri) {
        yt2.getLogger().info('[youtube2-browse] browseUri(' + uri + ')');

        let defer = libQ.defer();

        ViewHandlerFactory.getHandler(uri).then( (handler) => {
            return handler.browse();
        }).then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
            yt2.getLogger().error(error);
            defer.reject(error);
        });

        return defer.promise;
    }

    /**
     * Explodable uris:
     * - video[@videoId=...]
     * - videos[@playlistId=...]
     * - playlists[@channelId=...]
     * 
     */
    explodeUri(uri) {
        yt2.getLogger().info('[youtube2-browse] explodeUri(' + uri + ')');

        let defer = libQ.defer();

        ViewHandlerFactory.getHandler(uri).then( (handler) => {
            return handler.explode();
        }).then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
            yt2.getLogger().error(error);
            defer.reject(error);
        });

        return defer.promise;
    }

    goto(data) {
        let gotoUri = libQ.resolve('youtube2');
        let trackView = ViewHelper.getViewsFromUri(data.uri).pop();
        if (trackView && trackView.name === 'video' && trackView.videoId && (data.type === 'album' || data.type === 'artist')) {
            if (data.type === 'album' && trackView.fromPlaylistId) {
                gotoUri = libQ.resolve('youtube2/videos@playlistId=' + trackView.fromPlaylistId);
            }
            else {
                let model = Model.getInstance('video');
                gotoUri = model.getVideo(trackView.videoId)
                    .then( video => video && video.channel && video.channel.id ? 'youtube2/playlists@channelId=' + video.channel.id : 'youtube2' );
            }
        }
        return gotoUri.then( uri => this.browseUri(uri) );
    }
    

}

module.exports = BrowseController;