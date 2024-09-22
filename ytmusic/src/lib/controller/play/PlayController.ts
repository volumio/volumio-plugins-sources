// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import ytmusic from '../../YTMusicContext';
import Model, { ModelType } from '../../model';
import { EndpointType } from '../../types/Endpoint';
import { kewToJSPromise } from '../../util';
import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import ExplodeHelper from '../../util/ExplodeHelper';
import { ContentItem } from '../../types';
import MusicItemPlaybackInfo from '../../types/MusicItemPlaybackInfo';
import AutoplayHelper from '../../util/AutoplayHelper';
import AutoplayContext from '../../types/AutoplayContext';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import { GenericView } from '../browse/view-handlers/GenericViewHandler';
import EventEmitter from 'events';

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
  #prefetchPlaybackStateFixer: PrefetchPlaybackStateFixer | null;

  constructor() {
    this.#mpdPlugin = ytmusic.getMpdPlugin();
    this.#autoplayListener = null;
    this.#prefetchPlaybackStateFixer = new PrefetchPlaybackStateFixer();
    this.#prefetchPlaybackStateFixer.on('playPrefetch', (info: { track: QueueItem; position: number; }) => {
      this.#lastPlaybackInfo = info;
    });
  }

  reset() {
    this.#removeAutoplayListener();
    this.#prefetchPlaybackStateFixer?.reset();
    this.#prefetchPlaybackStateFixer = null;
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

    this.#prefetchPlaybackStateFixer?.notifyPrefetchCleared();

    const {videoId, info: playbackInfo} = await PlayController.getPlaybackInfoFromUri(track.uri);

    if (!playbackInfo) {
      throw Error(`Could not obtain playback info for: ${videoId})`);
    }

    const stream = playbackInfo.stream;
    if (!stream?.url) {
      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_NO_STREAM', track.name));
      throw Error(`Stream not found for: ${videoId}`);
    }

    const sm = ytmusic.getStateMachine();

    this.#updateTrackWithPlaybackInfo(track, playbackInfo);
    if (playbackInfo.duration) {
      /**
       * Notes:
       * - Ideally, we should have duration in `explodeTrackData` (set at browse time), but we didn't do this
       *   plus there is no guarantee that duration is always available when browsing.
       * - So we directly set `currentSongDuration` of statemachine -- required to trigger prefetch.
       */
      sm.currentSongDuration = playbackInfo.duration * 1000;
    }

    this.#lastPlaybackInfo = {
      track,
      position: sm.getState().position
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

  #updateTrackWithPlaybackInfo(track: QueueItem, playbackInfo: MusicItemPlaybackInfo) {
    track.title = playbackInfo.title || track.title;
    track.name = playbackInfo.title || track.title;
    track.artist = playbackInfo.artist?.name || track.artist;
    track.album = playbackInfo.album?.title || track.album;
    track.albumart = playbackInfo.thumbnail || track.albumart;
    track.duration = playbackInfo.duration;
    if (playbackInfo.stream?.bitrate) {
      track.samplerate = playbackInfo.stream.bitrate;
    }
    return track;
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

  static async getPlaybackInfoFromUri(uri: QueueItem['uri']): Promise<{videoId: string; info: MusicItemPlaybackInfo | null}> {
    const endpoint = ExplodeHelper.getExplodedTrackInfoFromUri(uri)?.endpoint;
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
    const explodedTrackInfo = ExplodeHelper.getExplodedTrackInfoFromUri(this.#lastPlaybackInfo?.track?.uri);
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
      const playbackInfo = await PlayController.getPlaybackInfoFromUri(this.#lastPlaybackInfo.track.uri);
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
      const { videoId, info: playbackInfo } = await PlayController.getPlaybackInfoFromUri(track.uri);
      streamUrl = playbackInfo?.stream?.url;
      if (!streamUrl || !playbackInfo) {
        throw Error(`Stream not found for: '${videoId}'`);
      }
      this.#updateTrackWithPlaybackInfo(track, playbackInfo);
    }
    catch (error: any) {
      ytmusic.getLogger().error(`[ytmusic-play] Prefetch failed: ${error}`);
      ytmusic.getStateMachine().prefetchDone = false;
      return;
    }

    const mpdPlugin = this.#mpdPlugin;
    const res = await kewToJSPromise(mpdPlugin.sendMpdCommand(`addid "${this.#appendTrackTypeToStreamUrl(streamUrl)}"`, [])
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        ytmusic.getLogger().info(`[ytmusic-play] Prefetched and added track to MPD queue: ${track.name}`);
        return mpdPlugin.sendMpdCommand('consume 1', []);
      }));

    this.#prefetchPlaybackStateFixer?.notifyPrefetched(track);

    return res;
  }

  async getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null> {
    const playbackInfo = (await PlayController.getPlaybackInfoFromUri(uri))?.info;
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

/**
 * Given state is updated by calling `setConsumeUpdateService('mpd', true)` (`consumeIgnoreMetadata`: true), when moving to
 * prefetched track there's no guarantee the state machine will store the correct consume state obtained from MPD. It depends on
 * whether the state machine increments `currentPosition` before or after MPD calls `pushState()`. The intended
 * order is 'before' - but because the increment is triggered through a timer, it is possible that MPD calls `pushState()` first,
 * thereby causing the state machine to store the wrong state info (title, artist, album...obtained from trackBlock at
 * `currentPosition` which has not yet been incremented).
 *
 * See state machine `syncState()` and  `increasePlaybackTimer()`.
 *
 * `PrefetchPlaybackStateFixer` checks whether the state is consistent when prefetched track is played and `currentPosition` updated
 * and triggers an MPD `pushState()` if necessary.
 */
class PrefetchPlaybackStateFixer extends EventEmitter {

  #positionAtPrefetch: number;
  #prefetchedTrack: QueueItem | null;
  #volumioPushStateListener: ((state: any) => void) | null;

  constructor() {
    super();
    this.#positionAtPrefetch = -1;
    this.#prefetchedTrack = null;
  }

  reset() {
    this.#removePushStateListener();
    this.removeAllListeners();
  }

  notifyPrefetched(track: QueueItem) {
    this.#positionAtPrefetch = ytmusic.getStateMachine().currentPosition;
    this.#prefetchedTrack = track;
    this.#addPushStateListener();
  }

  notifyPrefetchCleared() {
    this.#removePushStateListener();
  }

  #addPushStateListener() {
    if (!this.#volumioPushStateListener) {
      this.#volumioPushStateListener = this.#handleVolumioPushState.bind(this);
      ytmusic.volumioCoreCommand?.addCallback('volumioPushState', this.#volumioPushStateListener);
    }
  }

  #removePushStateListener() {
    if (this.#volumioPushStateListener) {
      const listeners = ytmusic.volumioCoreCommand?.callbacks?.['volumioPushState'] || [];
      const index = listeners.indexOf(this.#volumioPushStateListener);
      if (index >= 0) {
        ytmusic.volumioCoreCommand.callbacks['volumioPushState'].splice(index, 1);
      }
      this.#volumioPushStateListener = null;
      this.#positionAtPrefetch = -1;
      this.#prefetchedTrack = null;
    }
  }

  #handleVolumioPushState(state: any) {
    const sm = ytmusic.getStateMachine();
    const currentPosition = sm.currentPosition as number;
    if (sm.getState().service !== 'ytmusic') {
      this.#removePushStateListener();
      return;
    }
    if (this.#positionAtPrefetch >= 0 && this.#positionAtPrefetch !== currentPosition) {
      const track = sm.getTrack(currentPosition);
      const pf = this.#prefetchedTrack;
      this.#removePushStateListener();
      if (track && state && pf && track.service === 'ytmusic' && pf.uri === track.uri) {
        if (state.uri !== track.uri) {
          const mpdPlugin = ytmusic.getMpdPlugin();
          mpdPlugin.getState().then((st: any) => mpdPlugin.pushState(st));
        }
        this.emit('playPrefetch', {
          track: pf,
          position: currentPosition
        });
      }
    }
  }

  emit(event: 'playPrefetch', info: { track: QueueItem; position: number; }): boolean;
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: 'playPrefetch', listener: (info: { track: QueueItem; position: number; }) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
