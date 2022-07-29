'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const Model = require(mixcloudPluginLibRoot + '/model');
const ViewHelper = require(mixcloudPluginLibRoot + '/helper/view');
const miniget = require('miniget');
const m3u8 = require('m3u8-parser');

class PlayController {

    constructor() {
        this.mpdPlugin = mixcloud.getMpdPlugin();
    }

    /**
     * Track uri:
     * - mixcloud/cloudcast@cloudcastId={...}@owner={...}
     *
     */
    clearAddPlayTrack(track) {
        mixcloud.getLogger().info('[mixcloud-play] clearAddPlayTrack: ' + track.uri);

        let self = this;

        return self._getStreamUrl(track).then( streamUrl => {
            return self._doPlay(streamUrl, track);
        }).fail( error => {
            mixcloud.getLogger().error('[mixcloud-play] clearAddPlayTrack() error');
            mixcloud.getLogger().error(error);
        });
    }

    stop() {
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return this.mpdPlugin.stop();
    };

    pause() {
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return this.mpdPlugin.pause();
    };
  
    resume() {
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return this.mpdPlugin.resume();
    }
  
    seek(position) {
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return this.mpdPlugin.seek(position);
    }

    next() {
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return this.mpdPlugin.next();
    }

    previous() {
        mixcloud.getStateMachine().setConsumeUpdateService(undefined);
        return mixcloud.getStateMachine().previous();
    }

    _getStreamUrl(track) {
        let views = ViewHelper.getViewsFromUri(track.uri);
        let trackView = views[1];
        if (trackView == undefined) {
            trackView = { name: null };
        }
        if (trackView.name === 'cloudcast' && trackView.cloudcastId) {
            let cloudcastId = decodeURIComponent(trackView.cloudcastId);
            let model = Model.getInstance('cloudcast');
            return model.getCloudcast(cloudcastId).then( cloudcast => {
                let stream = cloudcast.streams ? cloudcast.streams.hls || 
                    cloudcast.streams.http || cloudcast.streams.dash : null;
                if (!stream) {
                    if (cloudcast.isExclusive) {
                        mixcloud.toast('warning', mixcloud.getI18n('MIXCLOUD_SKIP_EXCLUSIVE', track.name));
                        mixcloud.getStateMachine().next();
                        return libQ.reject('Skipping exclusive cloudcast');
                    }
                    else {
                        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_NO_STREAM', track.name));
                        return libQ.reject(`Stream not found for cloudcastId: ${cloudcastId} (URL: ${cloudcast.url})`);
                    }
                }
                else {
                    // We setConsumeUpdateService to ignore metadata, so statemachine will take sample rate and bit depth from
                    // trackblock, which we don't have...At best, if stream is HLS, we try to obtain the max bit rate (bandwidth) and set it
                    // as the sample rate. Otherwise, statemachine will obtain the bitrate from MPD but this is not always available.
                    let fetchBitrate = libQ.resolve(null);
                    if (cloudcast.streams.hls) {
                        fetchBitrate = this._getBandwidthFromHLS(stream)
                            .then( bandwidth => bandwidth ? `${ Math.floor(bandwidth / 1000) } kbps` : null );
                    }

                    return fetchBitrate.then( bitrate => {
                        if (bitrate !== null) {
                            track.samplerate = bitrate;
                        }
                        let safeUri = stream.replace(/"/g, '\\"');
                        return safeUri;
                    });
                }
            });
        }
        else {
            return libQ.reject('Invalid track uri: ' + track.uri);
        }
    }

    _doPlay(streamUrl, track) {
        let mpdPlugin = this.mpdPlugin;

        return mpdPlugin.sendMpdCommand('stop', [])
        .then( () => {
            return mpdPlugin.sendMpdCommand('clear', []);
        })
        .then( () => {
            return mpdPlugin.sendMpdCommand('addid "' + streamUrl + '"', []);
        })
        .then( addIdResp => {
            if (addIdResp && typeof addIdResp.Id != undefined) {
                let trackUrl = addIdResp.Id;

                let cmdAddTitleTag = {
                    command: 'addtagid',
                    parameters: [trackUrl, 'title', track.title]
                };
                /*let cmdAddAlbumTag = {
                    command: 'addtagid',
                    parameters: [trackUrl, 'album', track.album]
                }*/
                let cmdAddArtistTag = {
                    command: 'addtagid',
                    parameters: [trackUrl, 'artist', track.artist]
                }

                return mpdPlugin.sendMpdCommandArray([cmdAddTitleTag, /*cmdAddAlbumTag,*/ cmdAddArtistTag]);
            }
            else {
                return libQ.resolve();
            }
        })
        .then( () => {
            mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
            return mpdPlugin.sendMpdCommand('play', []);
        });
    }

    _getBandwidthFromHLS(streamUrl) {
        let defer = libQ.defer();

        miniget(streamUrl).text().then( body => {
            let result = null;
            let parser = new m3u8.Parser();
            parser.push(body);
            parser.end();
            let manifest = parser.manifest || {};
            if (Array.isArray(manifest.playlists) && manifest.playlists[0]) {
                let attributes = manifest.playlists[0].attributes || {};
                result = attributes.BANDWIDTH || null;
            }
            defer.resolve(result);
        })
        .catch( err => {
            defer.resolve(null);
        });

        return defer.promise;
    }

}

module.exports = PlayController;