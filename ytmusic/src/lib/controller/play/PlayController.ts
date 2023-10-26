// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import ytmusic from '../../YTMusicContext';
import Model, { ModelType } from '../../model';
import { EndpointType } from '../../types/Endpoint';
import { kewToJSPromise } from '../../util';
import { ExplodedTrackInfo } from '../browse/view-handlers/ExplodableViewHandler';
import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
import { MusicItemView } from '../browse/view-handlers/MusicItemViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import ExplodeHelper from '../../util/ExplodeHelper';
import { ContentItem } from '../../types';
import MusicItemPlaybackInfo from '../../types/MusicItemPlaybackInfo';
import AutoplayHelper from '../../util/AutoplayHelper';
import AutoplayContext from '../../types/AutoplayContext';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import { GenericView } from '../browse/view-handlers/GenericViewHandler';
import EndpointHelper from '../../util/EndpointHelper';

interface MpdState {
  status: 'play' | 'stop' | 'pause';
  seek: number;
  uri: string;
}

export default class PlayController {

  #mpdPlugin: any;
  #autoplayListener: (() => void) | null;
  #lastPlaybackInfo: {
    track: QueueItem;
    position: number;
  };

  constructor() {
    this.#mpdPlugin = ytmusic.getMpdPlugin();
    this.#autoplayListener = null;
  }

  #addAutoplayListener() {
    if (!this.#autoplayListener) {
      this.#autoplayListener = () => {
        this.#mpdPlugin.getState().then((state: MpdState) => {
          if (state.status === 'stop') {
            this.#handleAutoplay();
            this.#removeAutoplayListener();
          }
        });
      };
      this.#mpdPlugin.clientMpd.on('system-player', this.#autoplayListener);
    }
  }

  #removeAutoplayListener() {
    if (this.#autoplayListener) {
      this.#mpdPlugin.clientMpd.removeListener('system-player', this.#autoplayListener);
      this.#autoplayListener = null;
    }
  }

  /**
   * Track uri:
   * - ytmusic/[song|video]@@explodeTrackData={...}
   *
   */
  async clearAddPlayTrack(track: QueueItem) {
    ytmusic.getLogger().info(`[ytmusic-play] clearAddPlayTrack: ${track.uri}`);

    const {videoId, info: playbackInfo} = await this.#getPlaybackInfoFromUri(track.uri);

    if (!playbackInfo) {
      throw Error(`Could not obtain playback info for: ${videoId})`);
    }

    const stream = playbackInfo.stream;
    if (!stream?.url) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_NO_STREAM', track.name));
      throw Error(`Stream not found for: ${videoId}`);
    }

    track.title = playbackInfo.title || track.title;
    track.name = playbackInfo.title || track.title;
    track.artist = playbackInfo.artist?.name || track.artist;
    track.album = playbackInfo.album?.title || track.album;
    track.albumart = playbackInfo.thumbnail || track.albumart;
    track.duration = playbackInfo.duration;

    if (stream.bitrate) {
      track.samplerate = stream.bitrate;
    }

    this.#lastPlaybackInfo = {
      track,
      position: ytmusic.getStateMachine().getState().position
    };

    const safeStreamUrl = stream.url.replace(/"/g, '\\"');
    await this.#doPlay(safeStreamUrl, track);

    if (ytmusic.getConfigValue('autoplay')) {
      this.#addAutoplayListener();
    }

    if (ytmusic.getConfigValue('addToHistory')) {
      try {
        playbackInfo.addToHistory();
      }
      catch (error) {
        ytmusic.getLogger().error(ytmusic.getErrorMessage(`[ytmusic-play] Error: could not add to history (${videoId}): `, error));
      }
    }
  }

  // Returns kew promise!
  stop() {
    this.#removeAutoplayListener();
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.stop();
  }

  // Returns kew promise!
  pause() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.pause();
  }

  // Returns kew promise!
  resume() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.resume();
  }

  // Returns kew promise!
  seek(position: number) {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.seek(position);
  }

  // Returns kew promise!
  next() {
    ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.next();
  }

  // Returns kew promise!
  previous() {
    ytmusic.getStateMachine().setConsumeUpdateService(undefined);
    return ytmusic.getStateMachine().previous();
  }

  #getExplodedTrackInfoFromUri(uri: string): ExplodedTrackInfo | null {
    if (!uri) {
      return null;
    }

    const trackView = ViewHelper.getViewsFromUri(uri)[1] as MusicItemView;

    if (!trackView || (trackView.name !== 'video' && trackView.name !== 'song') ||
      !EndpointHelper.isType(trackView.explodeTrackData?.endpoint, EndpointType.Watch)) {
      return null;
    }

    return trackView.explodeTrackData;
  }

  async #getPlaybackInfoFromUri(uri: QueueItem['uri']): Promise<{videoId: string; info: MusicItemPlaybackInfo | null}> {
    const endpoint = this.#getExplodedTrackInfoFromUri(uri)?.endpoint;
    const videoId = endpoint?.payload?.videoId;

    if (!videoId) {
      throw Error(`Invalid track uri: ${uri}`);
    }

    const model = Model.getInstance(ModelType.MusicItem);
    return {
      videoId,
      info: await model.getPlaybackInfo(endpoint)
    };
  }

  #doPlay(streamUrl: string, track: QueueItem) {
    const mpdPlugin = this.#mpdPlugin;

    return kewToJSPromise(mpdPlugin.sendMpdCommand('stop', [])
      .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
      })
      .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${this.#appendTrackTypeToStreamUrl(streamUrl)}"`, []);
      })
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        ytmusic.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      }));
  }

  #appendTrackTypeToStreamUrl(url: string) {
    /**
     * Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
     * track type to URL query string as a dummy param.
     */
    return `${url}&t.YouTube`;
  }

  // Returns kew promise!
  #mpdAddTags(mpdAddIdResponse: { Id: string }, track: QueueItem) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
      const cmds = [];
      cmds.push({
        command: 'addtagid',
        parameters: [ songId, 'title', track.title ]
      });
      if (track.album) {
        cmds.push({
          command: 'addtagid',
          parameters: [ songId, 'album', track.album ]
        });
      }
      cmds.push({
        command: 'addtagid',
        parameters: [ songId, 'artist', track.artist ]
      });

      return this.#mpdPlugin.sendMpdCommandArray(cmds);
    }
    return libQ.resolve();
  }

  async #handleAutoplay() {
    const lastPlayedQueueIndex = this.#findLastPlayedTrackQueueIndex();
    if (lastPlayedQueueIndex < 0) {
      return;
    }

    const stateMachine = ytmusic.getStateMachine(),
      state = stateMachine.getState(),
      isLastTrack = stateMachine.getQueue().length - 1 === lastPlayedQueueIndex,
      currentPositionChanged = state.position !== lastPlayedQueueIndex; // True if client clicks on another item in the queue

    const noAutoplayConditions = !ytmusic.getConfigValue('autoplay') || currentPositionChanged || !isLastTrack || state.random || state.repeat || state.repeatSingle;
    const getAutoplayItemsPromise = noAutoplayConditions ? Promise.resolve(null) : this.#getAutoplayItems();

    if (!noAutoplayConditions) {
      ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_AUTOPLAY_FETCH'));
    }

    const items = await getAutoplayItemsPromise;
    if (items && items.length > 0) {
      // Add items to queue and play
      const clearQueue = ytmusic.getConfigValue('autoplayClearQueue');
      if (clearQueue) {
        stateMachine.clearQueue();
      }
      stateMachine.addQueueItems(items).then((result: { firstItemIndex: number }) => {
        if (items.length > 1) {
          ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_AUTOPLAY_ADDED', items.length));
        }
        else {
          ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_AUTOPLAY_ADDED_SINGLE', items[0].title));
        }
        stateMachine.play(result.firstItemIndex);
      });
    }
    else if (!noAutoplayConditions) {
      ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_AUTOPLAY_NO_ITEMS'));
    }
  }

  #findLastPlayedTrackQueueIndex() {
    if (!this.#lastPlaybackInfo) {
      return -1;
    }

    const queue = ytmusic.getStateMachine().getQueue();
    const trackUri = this.#lastPlaybackInfo.track.uri;
    const endIndex = this.#lastPlaybackInfo.position;

    for (let i = endIndex; i >= 0; i--) {
      if (queue[i]?.uri === trackUri) {
        return i;
      }
    }

    return -1;
  }

  async #getAutoplayItems(): Promise<QueueItem[]> {
    const explodedTrackInfo = this.#getExplodedTrackInfoFromUri(this.#lastPlaybackInfo?.track?.uri);
    const autoplayContext = explodedTrackInfo?.autoplayContext;

    if (autoplayContext) {
      ytmusic.getLogger().info(`[ytmusic-play] Obtaining autoplay videos from endpoint: ${JSON.stringify(autoplayContext.fetchEndpoint)}`);
    }
    else {
      ytmusic.getLogger().info('[ytmusic-play] No autoplay context provided');
    }

    const endpointModel = Model.getInstance(ModelType.Endpoint);
    const contents = autoplayContext ? await endpointModel.getContents(autoplayContext.fetchEndpoint) : null;

    const autoplayItems: ContentItem.MusicItem[] = [];
    let newAutoplayContext: AutoplayContext | null = null;

    if (contents) {
      let items;
      if (contents.isContinuation) { // WatchContinuationContent
        items = contents.items;
      }
      else { // WatchContent
        items = contents.playlist?.items;
      }
      if (items) {
        const continueFromVideoId = autoplayContext?.fetchEndpoint.payload.videoId;
        let currentIndex = 0;
        if (continueFromVideoId) {
          currentIndex = items?.findIndex((item) => item.videoId === continueFromVideoId) || 0;
        }
        if (currentIndex < 0) {
          currentIndex = 0;
        }
        const itemsAfter = items?.slice(currentIndex + 1).filter((item) => item.type === 'video' || item.type === 'song') || [];
        autoplayItems.push(...itemsAfter);
        ytmusic.getLogger().info(`[ytmusic-play] Obtained ${itemsAfter.length} items for autoplay from current playlist`);
        if (itemsAfter.length > 0) {
          newAutoplayContext = AutoplayHelper.getAutoplayContext(contents);
        }
      }

      if (autoplayItems.length <= 5 && !contents.isContinuation && contents.automix) {
        const automixContents = await endpointModel.getContents(contents.automix.endpoint);
        const items = automixContents?.playlist?.items;
        if (items) {
          autoplayItems.push(...items);
          ytmusic.getLogger().info(`[ytmusic-play] Obtained ${items.length} items for autoplay from automix`);
          if (items.length > 0) {
            newAutoplayContext = AutoplayHelper.getAutoplayContext(automixContents);
          }
        }
      }
    }

    if (autoplayItems.length === 0) {
      // Fetch from radio endpoint as last resort.
      const playbackInfo = await this.#getPlaybackInfoFromUri(this.#lastPlaybackInfo.track.uri);
      const radioEndpoint = playbackInfo.info?.radioEndpoint;
      if (radioEndpoint && (!autoplayContext || radioEndpoint.payload.playlistId !== autoplayContext.fetchEndpoint.payload.playlistId)) {
        const radioContents = await endpointModel.getContents(radioEndpoint);
        const items = radioContents?.playlist?.items;
        if (items) {
          const currentIndex = items.findIndex((item) => item.videoId === playbackInfo.videoId) || 0;
          const itemsAfter = items.slice(currentIndex + 1).filter((item) => item.type === 'video' || item.type === 'song') || [];
          autoplayItems.push(...itemsAfter);
          ytmusic.getLogger().info(`[ytmusic-play] Obtained ${itemsAfter.length} items for autoplay from radio`);
          if (items.length > 0) {
            newAutoplayContext = AutoplayHelper.getAutoplayContext(radioContents);
          }
        }
      }
    }

    if (newAutoplayContext) {
      for (const item of autoplayItems) {
        item.autoplayContext = newAutoplayContext;
      }
    }

    return autoplayItems
      .map((item) => ExplodeHelper.getExplodedTrackInfoFromMusicItem(item))
      .map((item) => ExplodeHelper.createQueueItemFromExplodedTrackInfo(item));
  }

  async prefetch(track: QueueItem) {
    const prefetchEnabled = ytmusic.getConfigValue('prefetch');
    if (!prefetchEnabled) {
      /**
       * Volumio doesn't check whether `prefetch()` is actually performed or
       * successful (such as inspecting the result of the function call) -
       * it just sets its internal state variable `prefetchDone`
       * to `true`. This results in the next track being skipped in cases
       * where prefetch is not performed or fails. So when we want to signal
       * that prefetch is not done, we would have to directly falsify the
       * statemachine's `prefetchDone` variable.
       */
      ytmusic.getLogger().info('[ytmusic-play] Prefetch disabled');
      ytmusic.getStateMachine().prefetchDone = false;
      return;
    }
    let streamUrl;
    try {
      const { videoId, info: playbackInfo } = await this.#getPlaybackInfoFromUri(track.uri);
      streamUrl = playbackInfo?.stream?.url;
      if (!streamUrl) {
        throw Error(`Stream not found for: '${videoId}'`);
      }
    }
    catch (error: any) {
      ytmusic.getLogger().error(`[ytmusic-play] Prefetch failed: ${error}`);
      ytmusic.getStateMachine().prefetchDone = false;
      return;
    }

    const mpdPlugin = this.#mpdPlugin;
    return kewToJSPromise(mpdPlugin.sendMpdCommand(`addid "${this.#appendTrackTypeToStreamUrl(streamUrl)}"`, [])
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        ytmusic.getLogger().info(`[ytmusic-play] Prefetched and added track to MPD queue: ${track.name}`);
        return mpdPlugin.sendMpdCommand('consume 1', []);
      }));
  }

  async getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null> {
    const playbackInfo = (await this.#getPlaybackInfoFromUri(uri))?.info;
    if (!playbackInfo) {
      return null;
    }

    if (type === 'album' && playbackInfo.album.albumId) {
      const targetView: AlbumView = {
        name: 'album',
        endpoints: {
          browse: {
            type: EndpointType.Browse,
            payload: {
              browseId: playbackInfo.album.albumId
            }
          },
          // `watch` endpoint is actually not necessary in GoTo context, but required by AlbumView.
          watch: {
            type: EndpointType.Watch,
            payload: {
              playlistId: playbackInfo.album.albumId
            }
          }
        }
      };
      return `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`;
    }

    if (type === 'artist' && playbackInfo.artist.channelId) {
      const targetView: GenericView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Browse,
          payload: {
            browseId: playbackInfo.artist.channelId
          }
        }
      };
      return `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`;
    }

    return null;
  }
}
