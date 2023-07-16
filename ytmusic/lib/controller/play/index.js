'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const Model = require(ytmusicPluginLibRoot + '/model');
const ViewHelper = require(ytmusicPluginLibRoot + '/helper/view');
const AutoplayHelper = require(ytmusicPluginLibRoot + '/helper/autoplay');
const TrackHelper = require(ytmusicPluginLibRoot + '/helper/track');
const Parser = require(ytmusicPluginLibRoot + '/controller/browse/view-handlers/parser')

class PlayController {

  constructor() {
    this.mpdPlugin = ytmusic.getMpdPlugin();

    this.autoplayListener = () => {
      this.mpdPlugin.getState().then((state) => {
        if (state.status === 'stop') {
          this._handleAutoplay();
          this.mpdPlugin.clientMpd.removeListener('system-player', this.autoplayListener);
        }
      });
    }
  }

  /**
   * Track uri:
   * - ytmusic/video@videoId={...}@playlistId={...}@explodeTrackData={...}@autoplayContext={...}
   *
   */
  clearAddPlayTrack(track) {
    ytmusic.getLogger().info('[ytmusic-play] clearAddPlayTrack(): ' + track.uri);

    const defer = libQ.defer();
    const trackView = this._parseTrackUri(track.uri);

    if (!trackView) {
      throw new Error('Invalid track uri: ' + track.uri);
    }

    const model = Model.getInstance('video');
    model.getPlaybackData(trackView.videoId, trackView.playlistId).then((playbackData) => {
      const {videoInfo, stream} = playbackData;
      if (!videoInfo) {
        throw new Error(`Video not found (videoId: ${trackView.videoId})`);
      }

      if (!stream || !stream.url) {
        ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_NO_STREAM', track.name));
        throw new Error(`Stream not found (videoId: ${trackView.videoId})`);
      }

      track.title = videoInfo.title;
      track.name = videoInfo.title;
      track.artist = videoInfo.artistText || track.artist;
      track.album = videoInfo.albumText || track.album;
      track.albumart = videoInfo.thumbnail?.url || track.albumart;
      if (stream.bitrate) {
        track.samplerate = stream.bitrate;
      }

      this.lastPlayedTrackInfo = {
        track,
        position: ytmusic.getStateMachine().getState().position,
      };

      const safeStreamUrl = stream.url.replace(/"/g, '\\"');
      this._doPlay(safeStreamUrl, track).then(() => {
        if (ytmusic.getConfigValue('autoplay', false)) {
          this.mpdPlugin.clientMpd.on('system-player', this.autoplayListener);
        }

        if (ytmusic.getConfigValue('addToHistory', true)) {
          try {
            playbackData.addToHistory();
          } catch (error) {
            ytmusic.getLogger().error(ytmusic.getErrorMessage(`[ytmusic-play] Error: could not add to history (videoId: ${trackView.videoId}): `, error));
          }
        }

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
    const videoId = this._parseTrackUri(data.uri)?.videoId;
    if (videoId) {
      const model = Model.getInstance('video');
      const videoInfo = await model.getInfoByUpNext(videoId);
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

  _parseTrackUri(uri) {
    if (!uri) {
      return null;
    }
    const views = ViewHelper.getViewsFromUri(uri);
    const trackView = views[1];
    if (trackView === undefined) {
      trackView = { name: null };
    }
    if (trackView.name === 'video' && trackView.videoId) {
      return {
        ...trackView,
        videoId: decodeURIComponent(trackView.videoId),
        playlistId: trackView.playlistId ? decodeURIComponent(trackView.playlistId) : null,
        autoplayContext: trackView.autoplayContext ? JSON.parse(decodeURIComponent(trackView.autoplayContext)) : null
      };
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

  async _handleAutoplay() {
    const lastPlayedQueueIndex = this._findLastPlayedTrackQueueIndex();
    if (lastPlayedQueueIndex < 0) {
      return;
    }

    const stateMachine = ytmusic.getStateMachine(),
      state = stateMachine.getState(),
      isLastTrack = stateMachine.getQueue().length - 1 === lastPlayedQueueIndex,
      currentPositionChanged = state.position !== lastPlayedQueueIndex; // true if client clicks on another item in the queue

    const noAutoplayConditions = !ytmusic.getConfigValue('autoplay', false) || currentPositionChanged || !isLastTrack || state.random || state.repeat || state.repeatSingle;
    const getAutoplayItemsPromise = noAutoplayConditions ? Promise.resolve(null) : this._getAutoplayItems();

    if (!noAutoplayConditions) {
      ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_AUTOPLAY_FETCH'));
    }

    const items = await getAutoplayItemsPromise;
    if (items?.length > 0) {
      // Add items to queue and play
      const clearQueue = ytmusic.getConfigValue('autoplayClearQueue', false);
      if (clearQueue) {
        stateMachine.clearQueue();
      }
      stateMachine.addQueueItems(items).then((result) => {
        ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_AUTOPLAY_ADDED', items.length));
        stateMachine.play(result.firstItemIndex);
      });
    }
    else if (!noAutoplayConditions) {
      ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_AUTOPLAY_NO_ITEMS'));
    }
  }

  _findLastPlayedTrackQueueIndex() {
    if (!this.lastPlayedTrackInfo) {
      return -1;
    }

    const queue = ytmusic.getStateMachine().getQueue();
    const trackUri = this.lastPlayedTrackInfo.track.uri;
    const endIndex = this.lastPlayedTrackInfo.position;

    for (let i = endIndex; i >= 0; i--) {
      if (queue[i]?.uri === trackUri) {
        return i;
      }
    }

    return -1;
  }

  async _getAutoplayItems() {
    const autoplayContext = this._parseTrackUri(this.lastPlayedTrackInfo?.track?.uri)?.autoplayContext;

    if (!autoplayContext) {
      return [];
    }
    
    const model = Model.getInstance('endpoint');
    const songParser = Parser.getInstance('song');
    const videoParser = Parser.getInstance('video');

    const endpoint = {
      actionType: 'watchPlaylist',
      payload: {
        playlistId: autoplayContext.playlistId,
        params: autoplayContext.params,
        videoId: autoplayContext.continueFromVideoId
      }
    };
    const contents = await model.getContents(endpoint, autoplayContext.continuation ? { continuation: { token: autoplayContext.continuation } } : null);
    if (autoplayContext.continueFromVideoId) {
      const continueFromVideoIdIndex = contents?.contents?.findIndex((item) => item.id === autoplayContext.continueFromVideoId);
      if (continueFromVideoIdIndex >= 0) {
        contents.contents.splice(0, continueFromVideoIdIndex + 1);
      }
    }

    // If too few or no current items, add from automix (if available)
    if (contents?.contents?.length <= 5 && contents?.automix?.endpoint?.actionType === 'watchPlaylist') {
      const automixContents = await model.getContents(contents.automix.endpoint);
      if (automixContents?.contents) {
        contents.contents.push(...(automixContents?.contents || []));
        contents.playlistId = automixContents.playlistId;
        contents.playlistParams = automixContents.playlistParams;
        contents.continuation = automixContents.continuation;
      }
    }

    const newAutoplayContext = AutoplayHelper.getAutoplayContext(contents, autoplayContext);
    return contents?.contents?.filter((item) => item.type === 'song' || item.type === 'video').map((item) => {
      const parser = item.type === 'song' ? songParser : videoParser;
      return TrackHelper.parseTrackForExplode(parser.getExplodeTrackData(item, { autoplayContext: newAutoplayContext }));
    }) || [];
  }
}

module.exports = PlayController;
