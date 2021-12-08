'use strict';

const libQ = require('kew');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const BaseViewHandler = require(__dirname + '/base');

class ExplodableViewHandler extends BaseViewHandler {

    explode() {
        let self = this;

        let view = self.getCurrentView();
        if (view.noExplode) {
            return libQ.resolve([]);
        }

        let defer = libQ.defer();

        this.getTracksOnExplode().then( tracks => {
            if (!Array.isArray(tracks)) {
                self._parseTrackForExplode(tracks).then( trackInfo => {
                    defer.resolve([trackInfo]);
                });
            }
            else {
                let parsePromises = [];
                tracks.forEach( (track, trackIndex) => {
                    parsePromises.push(self._parseTrackForExplode(track));
                });
                libQ.all(parsePromises).then( tracks => {
                    let items = [];
                    tracks.forEach( track => {
                        items.push(track);
                    });
                    defer.resolve(items);
                });
            }
        }).fail( error => {
            defer.reject(error);
        })

        return defer.promise;
    }

    getTracksOnExplode() {
        return libQ.resolve([]);
    }

    _parseTrackForExplode(track) {
        let trackName = !track.isExclusive ? track.name : UIHelper.addExclusiveText(track.name);
        let data = {
            'service': 'mixcloud',
            'uri': this._getTrackUri(track),
            'type': 'track',
            'albumart': track.thumbnail,
            'artist': track.owner.name,
            'album': '',
            'name': trackName,
            'title': trackName
        };
        return libQ.resolve(data);
    }

    /**
     * Track uri:
     * mixcloud/cloudcast@cloudcastId={...}@owner={...}
     */
    _getTrackUri(track) {
        return `mixcloud/cloudcast@cloudcastId=${encodeURIComponent(track.id)}@owner=${encodeURIComponent(track.owner.username)}`;
    }

}

module.exports = ExplodableViewHandler;