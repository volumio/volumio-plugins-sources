'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseViewHandler = require(__dirname + '/base');

class ExplodableViewHandler extends BaseViewHandler {

    explode() {
        let self = this;

        let view = self.getCurrentView();
        if (view.noExplode) {
            return libQ.resolve([]);
        }

        let defer = libQ.defer();

        this.getTracksOnExplode().then( (tracks) => {
            if (tracks == null) {
                defer.reject('Track not found');
            }
            else if (!Array.isArray(tracks)) {
                self._parseTrackForExplode(tracks).then( (trackInfo) => {
                    defer.resolve([trackInfo]);
                });
            }
            else {
                let parsePromises = [];
                tracks.forEach( (track) => {
                    parsePromises.push(self._parseTrackForExplode(track));
                });
                libQ.all(parsePromises).then( (tracks) => {
                    let items = [];
                    tracks.forEach( (track) => {
                        items.push(track);
                    });
                    defer.resolve(items);
                });
            }
        }).fail( (error) => {
            defer.reject(error);
        })

        return defer.promise;
    }

    getTracksOnExplode() {
        return libQ.resolve([]);
    }

    _parseTrackForExplode(track) {
        let defer = libQ.defer();
        let artistLabel;
        let albumLabel = track.album || sc.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
        switch(track.playableState) {
            case 'blocked':
                artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
                albumLabel = '';
                break;
            case 'snipped':
                artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_EXPLODE_SNIPPED') + ' ' + track.user.username;
                break;
            default:
                artistLabel = track.user.username;
        }
        let data = {
            'service': 'soundcloud',
            'uri': this._getTrackUri(track),
            'type': 'song',
            'albumart': track.thumbnail,
            'artist': artistLabel,
            'album': albumLabel,
            'name': track.title,
            'title': track.title
        };
        defer.resolve(data);
        return defer.promise;
    }

    /**
     * Track uri:
     * soundcloud/track@trackId={trackId}
     */
    _getTrackUri(track) {
        let uri = `soundcloud/track@trackId=${track.id}`;
        if (track.fromAlbumId) {
            uri += `@fromAlbumId=${ track.fromAlbumId }`;
        }
        else if (track.fromPlaylistId) {
            uri += `@fromPlaylistId=${ track.fromPlaylistId }`;
        }
        sc.getLogger().info('[soundcloud-explodable] getTrackUri(): ' + uri);
        return uri;
    }

}

module.exports = ExplodableViewHandler;