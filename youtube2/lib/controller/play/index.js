'use strict';

const libQ = require('kew');
const yt2 = require('../../youtube2');
const Model = require('../../model');
const ViewHelper = require('../../helper/view');
const TrackHelper = require('../../helper/track');
const Parser = require('../browse/view-handlers/parser');

class PlayController {

  constructor() {
    this.mpdPlugin = yt2.getMpdPlugin();

    this.autoplayListener = () => {
      this.mpdPlugin.getState().then((state) => {
        if (state.status === 'stop') {
          this._handleAutoplay();
          this.removeAutoplayListener();
        }
      });
    }
  }

  removeAutoplayListener() {
    this.mpdPlugin.clientMpd.removeListener('system-player', this.autoplayListener);
  }

  /**
   * Track uri:
   * - youtube2/video@endpoint={...}@explodeTrackData={...}
   *
   */
  clearAddPlayTrack(track) {
    yt2.getLogger().info('[youtube2-play] clearAddPlayTrack(): ' + track.uri);

    const defer = libQ.defer();
    const trackUriData = this._parseTrackUri(track.uri);

    if (!trackUriData) {
      throw Error('Invalid track uri: ' + track.uri);
    }

    const videoId = trackUriData.endpoint.payload.videoId;
    const model = Model.getInstance('video');
    model.getInfo(videoId).then((videoInfo) => {

      if (!videoInfo) {
        throw Error(`Could not obtain video info (videoId: ${videoId})`);
      }

      const stream = videoInfo.stream;

      if (!stream?.url) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_NO_STREAM', track.name));
        throw Error(`Stream not found (videoId: ${videoId})`);
      }

      track.title = videoInfo.title || track.title;
      track.name = videoInfo.title || track.title;
      track.artist = videoInfo.author?.name || track.artist;
      track.albumart = videoInfo.thumbnail || track.albumart;
      if (stream.bitrate) {
        track.samplerate = stream.bitrate;
      }

      this.lastPlayedTrackInfo = {
        track,
        position: yt2.getStateMachine().getState().position,
      };

      const safeStreamUrl = stream.url.replace(/"/g, '\\"');
      this._doPlay(safeStreamUrl, track).then(() => {
        if (yt2.getConfigValue('autoplay', false)) {
          this.mpdPlugin.clientMpd.on('system-player', this.autoplayListener);
        }

        if (yt2.getConfigValue('addToHistory', true)) {
          try {
            videoInfo.addToHistory();
          } catch (error) {
            yt2.getLogger().error(yt2.getErrorMessage(`[youtube2-play] Error: could not add to history (videoId: ${videoId}): `, error));
          }
        }

        defer.resolve();
      })
        .fail((error) => {
          defer.reject(error);
        });
    })
      .catch((error) => {
        yt2.getLogger().error(yt2.getErrorMessage('[youtube2-play] clearAddPlayTrack() error', error));
        defer.reject(error);
      })

    return defer.promise;
  }

  stop() {
    this.removeAutoplayListener();
    yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.stop();
  };

  pause() {
    yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.pause();
  };

  resume() {
    yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.resume();
  }

  seek(position) {
    yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.seek(position);
  }

  next() {
    yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.mpdPlugin.next();
  }

  previous() {
    yt2.getStateMachine().setConsumeUpdateService(undefined);
    return yt2.getStateMachine().previous();
  }

  async getGotoUri(data) {
    if (data.type === 'album') {
      const playlistId = this._parseTrackUri(data.uri)?.endpoint?.payload?.playlistId;
      if (playlistId) {
        const endpoint = {
          type: 'browse',
          payload: {
            browseId: (!playlistId.startsWith('VL') ? 'VL' : '') + playlistId
          }
        };
        return `youtube2/generic@endpoint=${encodeURIComponent(JSON.stringify(endpoint))}`;
      }
    }
    else if (data.type === 'artist') {
      const videoId = this._parseTrackUri(data.uri)?.endpoint?.payload?.videoId;
      if (videoId) {
        const model = Model.getInstance('video');
        const videoInfo = await model.getInfo(videoId);
        const channelId = videoInfo?.author?.channelId;
        if (channelId) {
          const endpoint = {
            type: 'browse',
            payload: {
              browseId: channelId
            }
          };
          return `youtube2/generic@endpoint=${encodeURIComponent(JSON.stringify(endpoint))}`;
        }
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

    if (!trackView || trackView.name !== 'video' || !trackView.endpoint) {
      return null;
    }

    const endpoint = JSON.parse(decodeURIComponent(trackView.endpoint));
    if (endpoint.type === 'watch') {
      return {
        ...trackView,
        endpoint
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
        yt2.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      });
  }

  async _handleAutoplay() {
    const lastPlayedQueueIndex = this._findLastPlayedTrackQueueIndex();
    if (lastPlayedQueueIndex < 0) {
      return;
    }

    const stateMachine = yt2.getStateMachine(),
      state = stateMachine.getState(),
      isLastTrack = stateMachine.getQueue().length - 1 === lastPlayedQueueIndex,
      currentPositionChanged = state.position !== lastPlayedQueueIndex; // true if client clicks on another item in the queue

    const noAutoplayConditions = !yt2.getConfigValue('autoplay', false) || currentPositionChanged || !isLastTrack || state.random || state.repeat || state.repeatSingle;
    const getAutoplayItemsPromise = noAutoplayConditions ? Promise.resolve(null) : this._getAutoplayItems();

    if (!noAutoplayConditions) {
      yt2.toast('info', yt2.getI18n('YOUTUBE2_AUTOPLAY_FETCH'));
    }

    const items = await getAutoplayItemsPromise;
    if (items?.length > 0) {
      // Add items to queue and play
      const clearQueue = yt2.getConfigValue('autoplayClearQueue', false);
      if (clearQueue) {
        stateMachine.clearQueue();
      }
      stateMachine.addQueueItems(items).then((result) => {
        if (items.length > 1) {
          yt2.toast('success', yt2.getI18n('YOUTUBE2_AUTOPLAY_ADDED', items.length));
        }
        else {
          yt2.toast('success', yt2.getI18n('YOUTUBE2_AUTOPLAY_ADDED_SINGLE', items[0].title));
        }
        stateMachine.play(result.firstItemIndex);
      });
    }
    else if (!noAutoplayConditions) {
      yt2.toast('info', yt2.getI18n('YOUTUBE2_AUTOPLAY_NO_ITEMS'));
    }
  }

  _findLastPlayedTrackQueueIndex() {
    if (!this.lastPlayedTrackInfo) {
      return -1;
    }

    const queue = yt2.getStateMachine().getQueue();
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
    const lastPlayedEndpoint = this._parseTrackUri(this.lastPlayedTrackInfo?.track?.uri)?.endpoint;

    if (!lastPlayedEndpoint?.payload?.videoId) {
      return [];
    }
    
    const autoplayPayload = {
      videoId: lastPlayedEndpoint.payload.videoId
    };
    if (lastPlayedEndpoint.payload.playlistId) {
      autoplayPayload.playlistId = lastPlayedEndpoint.payload.playlistId;

      if (lastPlayedEndpoint.payload.index) {
        autoplayPayload.playlistIndex = lastPlayedEndpoint.payload.index;
      }
    }
    if (lastPlayedEndpoint.payload.params) {
      autoplayPayload.params = lastPlayedEndpoint.payload.params;
    }
    
    const autoplayFetchEndpoint = {
      type: 'watch',
      payload: autoplayPayload
    };

    const endpointModel = Model.getInstance('endpoint');
    const contents = await endpointModel.getContents(autoplayFetchEndpoint);

    const autoplayItems = [];
    if (contents?.playlist) {
      const currentIndex = contents.playlist.currentIndex || 0;
      const itemsAfter = contents.playlist.items.slice(currentIndex + 1).filter((item) => item.type === 'video');
      autoplayItems.push(...itemsAfter);
    }
    if (autoplayItems.length === 0 && contents.autoplay?.payload?.videoId) {
      const videoModel = Model.getInstance('video');
      // contents.autoplay is just an endpoint, so we need to get video info (title, author...) from it
      const videoInfo = await videoModel.getInfo(contents.autoplay.payload.videoId);
      autoplayItems.push({
        type: 'video',
        title: videoInfo.title,
        author: videoInfo.author,
        thumbnail: videoInfo.thumbnail,
        endpoint: contents.autoplay 
      });
    }

    if (autoplayItems.length > 0) {
      const videoParser = Parser.getInstance('video');
      return autoplayItems.map((item) => TrackHelper.parseToQueueItem(videoParser.getExplodeTrackData(item)));
    }

    return [];
  }
}

module.exports = PlayController;
