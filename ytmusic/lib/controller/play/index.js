'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const Model = require(ytmusicPluginLibRoot + '/model');
const ViewHelper = require(ytmusicPluginLibRoot + '/helper/view');

class PlayController {

  constructor() {
    this.mpdPlugin = ytmusic.getMpdPlugin();
  }

  /**
   * Track uri:
   * - ytmusic/video@videoId={...}@explodeTrackData={...}
   *
   */
  clearAddPlayTrack(track) {
    ytmusic.getLogger().info('[ytmusic-play] clearAddPlayTrack(): ' + track.uri);

    const defer = libQ.defer();

    this._getPlaybackData(track).then((data) => {
      track.title = data.title;
      track.name = data.title;
      track.artist = data.artist;
      track.album = data.album;
      track.albumart = data.albumart;
      if (data.bitrate) {
        track.samplerate = data.bitrate;
      }

      this._doPlay(data.streamUrl, track).then(() => {
        defer.resolve();
      })
        .fail((error) => {
          defer.reject(error);
        });
    })
      .catch((error) => {
        ytmusic.getLogger().error('[ytmusic-play] clearAddPlayTrack() error');
        ytmusic.getLogger().error(error);

        defer.reject(error);
      })

    return defer.promise;
  }

  stop() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.stop();
  };

  pause() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.pause();
  };

  resume() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.resume();
  }

  seek(position) {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.seek(position);
  }

  next() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.next();
  }

  previous() {
    ytmusic.getStateMachine().setConsumeUpdateService(undefined);
    return ytmusic.getStateMachine().previous();
  }

  async getGotoUri(data) {
    const videoId = this._getVideoIdFromTrackUri(data.uri);
    if (videoId) {
      const model = Model.getInstance('video');
      const videoInfo = await model.getVideo(videoId);
      if (!videoInfo) {
        return null;
      }
      switch (data.type) {
        case 'album':
          const albumId = videoInfo.album?.id;
          return albumId ? `ytmusic/album@albumId=${encodeURIComponent(albumId)}` : null;
        case 'artist':
          const artistId = videoInfo.artists?.[0]?.id;
          return artistId ? `ytmusic/artist@artistId=${encodeURIComponent(artistId)}` : null;
        default:
          return null;
      }
    }

    return null;
  }

  async _getPlaybackData(track) {
    const videoId = this._getVideoIdFromTrackUri(track.uri);
    if (videoId) {
      const model = Model.getInstance('video');
      const [videoInfo, stream] = await Promise.all([model.getVideo(videoId), model.getStreamData(videoId)]);

      if (!videoInfo) {
        throw new Error(`Video not found (videoId: ${videoId})`);
      }

      if (!stream || !stream.url) {
        ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_NO_STREAM', track.name));
        throw new Error(`Stream not found (videoId: ${videoId})`);
      }

      const safeUri = stream.url.replace(/"/g, '\\"');

      return {
        title: videoInfo.title,
        artist: videoInfo.artistText || track.artist,
        album: videoInfo.albumText || track.album,
        albumart: videoInfo.thumbnail?.url || track.albumart,
        duration: videoInfo.duration,
        bitrate: stream.bitrate,
        streamUrl: safeUri
      };
    }
    else {
      throw new Error('Invalid track uri: ' + track.uri);
    }
  }

  _getVideoIdFromTrackUri(uri) {
    if (!uri) {
      return null;
    }
    const views = ViewHelper.getViewsFromUri(uri);
    const trackView = views[1];
    if (trackView === undefined) {
      trackView = { name: null };
    }
    if (trackView.name === 'video' && trackView.videoId) {
      return decodeURIComponent(trackView.videoId);
    }
    return null;
  }

  _doPlay(streamUrl, track) {
    const mpdPlugin = this.mpdPlugin;

    return mpdPlugin.sendMpdCommand('stop', [])
      .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
      })
      .then(() => {
        return mpdPlugin.sendMpdCommand('addid "' + streamUrl + '"', []);
      })
      .then((addIdResp) => {
        if (addIdResp && typeof addIdResp.Id != undefined) {
          const trackUrl = addIdResp.Id;

          const mpdCommands = [{
            command: 'addtagid',
            parameters: [trackUrl, 'title', track.title]
          }];

          if (track.album) {
            mpdCommands.push({
              command: 'addtagid',
              parameters: [trackUrl, 'album', track.album]
            });
          }

          if (track.artist) {
            mpdCommands.push({
              command: 'addtagid',
              parameters: [trackUrl, 'artist', track.artist]
            });
          }

          return mpdPlugin.sendMpdCommandArray(mpdCommands);
        }
        else {
          return libQ.resolve();
        }
      })
      .then(() => {
        ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      });
  }
}

module.exports = PlayController;
