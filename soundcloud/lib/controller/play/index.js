'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const Model = require(scPluginLibRoot + '/model');
const TrackHelper = require(scPluginLibRoot + '/helper/track');

class PlayController {

    constructor() {
        this.mpdPlugin = sc.getMpdPlugin();
    }

    /**
     * Track uri:
     * soundcloud/track@trackId=...
     */
    clearAddPlayTrack(track) {
        sc.getLogger().info('[soundcloud-play] clearAddPlayTrack: ' + track.uri);

        let self = this;

        let trackIdPrefix = 'track@trackId=';
        let uri = track.uri.split('/');
        let trackId;
        if (uri[1].startsWith(trackIdPrefix)) {
            trackId = uri[1].substring(trackIdPrefix.length);
            if (trackId === '') {
                trackId = undefined;
            }
        }
        if (uri[0] !== 'soundcloud' || trackId == undefined) {
            return libQ.reject('Invalid track uri: ' + track.uri);
        }
       
        let model = Model.getInstance('track');
        return model.getTrack(trackId)
        .then( (trackInfo) => {
            if (trackInfo.playableState === 'blocked') {
                sc.toast('warning', sc.getI18n('SOUNDCLOUD_SKIP_BLOCKED_TRACK', track.title));
                sc.getStateMachine().next();
                return libQ.reject('Skipping blocked track');
            } 
            else if (trackInfo.playableState === 'snipped' && sc.getConfigValue('skipPreviewTracks', false)) {
                sc.toast('warning', sc.getI18n('SOUNDCLOUD_SKIP_PREVIEW_TRACK', track.title));
                sc.getStateMachine().next();
                return libQ.reject('Skipping preview track');
            }
            else {
                return self._getMediaUrl(trackInfo);
            }
        }).then( (mediaUrl) => {
            let safeUri = mediaUrl.replace(/"/g, '\\"');
            return safeUri;
        }).then( (streamUrl) => {
            return self._doPlay(streamUrl, track);
        }).fail( (error) => {
            sc.getLogger().error('[soundcloud-play] clearAddPlayTrack() error');
            sc.getLogger().error(error);
        });
    }

    stop() {
        sc.getStateMachine().setConsumeUpdateService('mpd', false, false);
        return this.mpdPlugin.stop();
    };

    pause() {
        sc.getStateMachine().setConsumeUpdateService('mpd', false, false);
        return this.mpdPlugin.pause();
    };
  
    resume() {
        sc.getStateMachine().setConsumeUpdateService('mpd', false, false);
        return this.mpdPlugin.resume();
    }
  
    seek(position) {
        sc.getStateMachine().setConsumeUpdateService('mpd', false, false);
        return this.mpdPlugin.seek(position);
    }

    _getMediaUrl(track) {
        let transcodingUrl = TrackHelper.getPreferredTranscoding(track);
        if (transcodingUrl !== null) {
            let model = Model.getInstance('track');
            return model.getRealMediaUrl(transcodingUrl);
        }
        else {
            return libQ.reject('No transcoding found');
        }
    }

    _doPlay(streamUrl, track) {
        let self = this;
        let mpdPlugin = self.mpdPlugin;

        return mpdPlugin.sendMpdCommand('stop', [])
        .then( () => {
            return mpdPlugin.sendMpdCommand('clear', []);
        })
        /*.then( () => { // commented out because loading a SoundCloud track that happens to be a m3u8 playlist (hls streams) will mess things up
            return mpdPlugin.sendMpdCommand('load "' + streamUrl + '"', []);
        })*/
        .then( () => {
            return mpdPlugin.sendMpdCommand('addid "' + streamUrl + '"', []);
        })
        .then( (addIdResp) => {
            if (addIdResp && typeof addIdResp.Id != undefined) {
                let trackId = addIdResp.Id;

                let cmdAddTitleTag = {
                    command: 'addtagid',
                    parameters: [trackId, 'title', self._stripNewLine(track.title)]
                };
                let cmdAddAlbumTag = {
                    command: 'addtagid',
                    parameters: [trackId, 'album', self._stripNewLine(track.album)]
                }
                let cmdAddArtistTag = {
                    command: 'addtagid',
                    parameters: [trackId, 'artist', self._stripNewLine(track.artist)]
                }
                return mpdPlugin.sendMpdCommandArray([cmdAddTitleTag, cmdAddAlbumTag, cmdAddArtistTag]);
            }
            else {
                return libQ.resolve();
            }
        })
        .then( () => {
            sc.getStateMachine().setConsumeUpdateService('mpd', false, false);
            return mpdPlugin.sendMpdCommand('play', []);
        });
    }

    _stripNewLine(str) {
        return str.replace(/(\r\n|\n|\r)/gm,"");
    }
}

module.exports = PlayController;