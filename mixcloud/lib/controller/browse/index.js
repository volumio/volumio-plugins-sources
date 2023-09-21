'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');

class BrowseController {

    /* 
     *  uri follows a hierarchical view structure, starting with 'mixcloud'.
     * - If nothing follows 'mixcloud', the view would be 'root'.
     * 
     * After 'mixcloud/', the uri consists of segments representing the following views:
     * - discover[@slug=...][@orderBy=...][@country=...]
     * - featured[@slug=...][@orderBy=...]
     * - user[@username=...]
     * - cloudcasts[@username=...[@orderBy=...]][@playlistId=...]
     * - cloudcast[@cloudcastId=...][@showMoreFromUser=1]
     * ...
     * 
     */
    browseUri(uri) {
        mixcloud.getLogger().info('[mixcloud-browse] browseUri(' + uri + ')');

        let defer = libQ.defer();

        let handler = ViewHandlerFactory.getHandler(uri);
        handler.browse().then( result => {
            defer.resolve(result);
        }).fail( error => {
            if (error.stack) { console.log(error.stack); }
            defer.reject(error);
        });

        return defer.promise;
    }

    /**
     * Explodable uris:
     * - cloudcast[@cloudcastId=...][@owner=...]
     * 
     */
    explodeUri(uri) {
        mixcloud.getLogger().info('[mixcloud-browse] explodeUri(' + uri + ')');

        let defer = libQ.defer();

        let handler = ViewHandlerFactory.getHandler(uri);
        handler.explode().then( result => {
            defer.resolve(result);
        }).fail( error => {
            if (error.stack) { console.log(error.stack); }
            defer.reject(error);
        });

        return defer.promise;
    }

}

module.exports = BrowseController;