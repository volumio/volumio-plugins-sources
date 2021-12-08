'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BaseViewHandler = require(__dirname + '/base');

class ExplodableViewHandler extends BaseViewHandler {

    explode() {
        let self = this;

        let view = self.getCurrentView();
        if (view.noExplode) {
            return libQ.resolve([]);
        }

        let defer = libQ.defer();

        this.getVideosOnExplode().then( (videos) => {
            if (videos == null) {
                defer.reject('Video not found');
            }
            else if (!Array.isArray(videos)) {
                self._parseVideoForExplode(videos).then( (videoInfo) => {
                    defer.resolve([videoInfo]);
                });
            }
            else {
                let parsePromises = [];
                videos.forEach( (video) => {
                    parsePromises.push(self._parseVideoForExplode(video));
                });
                libQ.all(parsePromises).then( (videos) => {
                    let items = [];
                    videos.forEach( (video) => {
                        items.push(video);
                    });
                    defer.resolve(items);
                });
            }
        }).fail( (error) => {
            defer.reject(error);
        })

        return defer.promise;
    }

    getVideosOnExplode() {
        return libQ.resolve([]);
    }

    _parseVideoForExplode(video) {
        let defer = libQ.defer();
        let autoplay = this.getCurrentView().autoplay;
        let data = {
            'service': 'youtube2',
            'uri': this._getTrackUri(video, autoplay),
            'type': 'song',
            'albumart': video.thumbnail,
            'artist': video.channel.title,
            'album': yt2.getI18n('YOUTUBE2_VIDEO_PARSER_ALBUM'),
            'name': autoplay ? yt2.getI18n('YOUTUBE2_VIDEO_TITLE_AUTOPLAY', video.title) : video.title,
            'title': video.title
        };
        defer.resolve(data);
        return defer.promise;
    }

    /**
     * Track uri:
     * youtube2/{videoId}
     */
    _getTrackUri(video, autoplay = false) {
        let uri = `youtube2/video${autoplay ? '@autoplay=1' : ''}@videoId=${video.id}`;
        if (video.fromPlaylistId) {
            uri += `@fromPlaylistId=${ video.fromPlaylistId }`;
        }
        yt2.getLogger().info('[youtube2-explodable] getTrackUri(): ' + uri);
        return uri;
    }

}

module.exports = ExplodableViewHandler;