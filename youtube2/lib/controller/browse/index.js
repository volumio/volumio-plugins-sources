'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');

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

}

module.exports = BrowseController;