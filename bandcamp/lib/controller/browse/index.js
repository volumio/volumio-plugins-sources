'use strict';

const libQ = require('kew');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');

class BrowseController {

    /* 
     *  uri follows a hierarchical view structure, starting with 'bandcamp'.
     * - If nothing follows 'bandcamp', the view would be 'root'.
     * 
     * After 'bandcamp/', the uri consists of segments representing the following views:
     * - discover[@genre=...][@subgenre=...][@sortBy=...][@artistRecommendationType=...][@location=...][@format=...][@time=...][@pageRef=...]
     * - album[@albumUrl=...]
     * - search[@query=...][@itemType=...][@pageRef=...]
     * - band[@bandUrl=...][band.type==='label': @view=artists|discography][@pageRef=...]*
     * - track[@trackUrl=...]
     * - shows[@showUrl=...|@pageRef=...][@view=tracks|albums]
     * - tag[@tagUrl=...][@select=...][@format=...][@location=...][@sort=...][@pageRef=...]
     * - fan[@username=...][@view=collection|wishlist|followingArtistsAndLabels|followingGenres][@pageRef=...]
     * 
     * *Replaces obsolete 'artist' and 'label' views
     */
    browseUri(uri) {
        bandcamp.getLogger().info('[bandcamp-browse] browseUri(' + uri + ')');

/*        if (uri === 'bandcamp') {
            return this.browseUri('bandcamp/discover');
        }*/

        let defer = libQ.defer();

        let handler = ViewHandlerFactory.getHandler(uri);
        handler.browse().then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
if (error.stack) { console.log(error.stack); }
            defer.reject(error);
        });

        return defer.promise;
    }

    /**
     * Explodable uris:
     * - track[@trackUrl=...]
     * - album[@albumUrl=...]
     * - shows[@showUrl=...]
     */
    explodeUri(uri) {
        bandcamp.getLogger().info('[bandcamp-browse] explodeUri(' + uri + ')');

        let defer = libQ.defer();

        let handler = ViewHandlerFactory.getHandler(uri);
        handler.explode().then( (result) => {
            defer.resolve(result);
        }).fail( (error) => {
if (error.stack) { console.log(error.stack); }
            defer.reject(error);
        });

        return defer.promise;
    }

}

module.exports = BrowseController;