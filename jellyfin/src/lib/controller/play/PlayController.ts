// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import ConnectionManager from '../../connection/ConnectionManager';
import ServerConnection from '../../connection/ServerConnection';
import { Song } from '../../entities';
import jellyfin from '../../JellyfinContext';
import Model, { ModelType } from '../../model';
import { ExplodedTrackInfo } from '../browse/view-handlers/Explodable';
import ServerHelper from '../../util/ServerHelper';
import { kewToJSPromise } from '../../util';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import StopWatch from '../../util/StopWatch';
import EventEmitter from 'events';

interface PlaybackInfo {
  song: Song;
  connection: ServerConnection;
  streamUrl: string;
  lastStatus?: MpdState['status'];
}

interface LastPlaybackReport {
  type: ApiReportPlaybackParams['type'];
  seek: number;
}

interface MonitoredPlaybacks {
  current: Required<PlaybackInfo> & { lastReport?: LastPlaybackReport, timer: StopWatch } | null;
  pending: Omit<PlaybackInfo, 'lastStatus'> & { lastReport?: LastPlaybackReport, timer: StopWatch } | null;
}

interface MpdState {
  status: 'play' | 'stop' | 'pause';
  seek: number;
  uri: string;
}

interface ApiReportPlaybackParams {
  type: 'start' | 'stop' | 'pause' | 'unpause' | 'timeupdate';
  song: Song;
  connection: ServerConnection;
  seek: number; // Milliseconds
}

export default class PlayController {

  #mpdPlugin: any;
  #connectionManager: ConnectionManager;
  #mpdPlayerStateListener: (() => void) | null;
  #monitoredPlaybacks: MonitoredPlaybacks;
  #volumioPushStateListener: VolumioPushStateListener | null;
  #volumioPushStateHandler: ((state: any) => void) | null;
  #prefetchPlaybackStateFixer: PrefetchPlaybackStateFixer | null;

  constructor(connectionManager: ConnectionManager) {
    this.#mpdPlugin = jellyfin.getMpdPlugin();
    this.#connectionManager = connectionManager;
    this.#mpdPlayerStateListener = null;
    this.#monitoredPlaybacks = { current: null, pending: null };
    this.#volumioPushStateListener = null;
    this.#volumioPushStateHandler = null;
    this.#prefetchPlaybackStateFixer = new PrefetchPlaybackStateFixer();
  }

  #addListeners() {
    if (!this.#mpdPlayerStateListener) {
      this.#mpdPlayerStateListener = this.#handleMpdPlayerEvent.bind(this);
      this.#mpdPlugin.clientMpd.on('system-player', this.#mpdPlayerStateListener);
    }
    if (!this.#volumioPushStateListener) {
      const psl = this.#volumioPushStateListener = new VolumioPushStateListener();
      this.#volumioPushStateHandler = psl.handleVolumioPushState.bind(psl);
      jellyfin.volumioCoreCommand?.addCallback('volumioPushState', this.#volumioPushStateHandler);
    }
  }

  #removeListeners() {
    if (this.#mpdPlayerStateListener) {
      this.#mpdPlugin.clientMpd.removeListener('system-player', this.#mpdPlayerStateListener);
      this.#mpdPlayerStateListener = null;
    }
    if (this.#volumioPushStateListener) {
      const listeners = jellyfin.volumioCoreCommand?.callbacks?.['volumioPushState'] || [];
      const index = listeners.indexOf(this.#volumioPushStateHandler);
      if (index >= 0) {
        jellyfin.volumioCoreCommand.callbacks['volumioPushState'].splice(index, 1);
      }
      this.#volumioPushStateHandler = null;
      this.#volumioPushStateListener = null;
    }
  }

  /**
   * Track uri:
   * jellyfin/{username}@{serverId}/song@songId={songId}
   */
  async clearAddPlayTrack(track: ExplodedTrackInfo): Promise<void> {
    jellyfin.getLogger().info(`[jellyfin-play] clearAddPlayTrack: ${track.uri}`);

    this.#prefetchPlaybackStateFixer?.notifyPrefetchCleared();

    const {song, connection} = await this.getSongFromTrack(track);
    const streamUrl = this.#appendTrackTypeToStreamUrl(this.#getStreamUrl(song, connection), track.trackType);
    this.#monitoredPlaybacks.pending = { song, connection, streamUrl, timer: new StopWatch() };
    this.#addListeners();
    await this.#doPlay(streamUrl, track);
    await this.#markPlayed(song, connection);
  }

  #appendTrackTypeToStreamUrl(url: string, trackType?: string) {
    if (!trackType) {
      return url;
    }
    /**
     * Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
     * track type to URL query string as a dummy param.
     */
    return `${url}&t.${trackType}`;
  }

  // Returns kew promise!
  stop() {
    jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.stop();
  }

  // Returns kew promise!
  pause() {
    jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.pause();
  }

  // Returns kew promise!
  resume() {
    jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.resume();
  }

  // Returns kew promise!
  seek(position: number) {
    jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.seek(position);
  }

  // Returns kew promise!
  next() {
    jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.next();
  }

  // Returns kew promise!
  previous() {
    jellyfin.getStateMachine().setConsumeUpdateService(undefined);
    return jellyfin.getStateMachine().previous();
  }

  dispose() {
    this.#removeListeners();
    this.#monitoredPlaybacks = { current: null, pending: null };
    this.#prefetchPlaybackStateFixer?.reset();
    this.#prefetchPlaybackStateFixer = null;
  }

  async prefetch(track: ExplodedTrackInfo) {
    const gaplessPlayback = jellyfin.getConfigValue('gaplessPlayback');
    if (!gaplessPlayback) {
      /**
       * Volumio doesn't check whether `prefetch()` is actually performed or
       * successful (such as inspecting the result of the function call) -
       * it just sets its internal state variable `prefetchDone`
       * to `true`. This results in the next track being skipped in cases
       * where prefetch is not performed or fails. So when we want to signal
       * that prefetch is not done, we would have to directly falsify the
       * statemachine's `prefetchDone` variable.
       */
      jellyfin.getLogger().info('[jellyfin-play] Prefetch disabled');
      jellyfin.getStateMachine().prefetchDone = false;
      return;
    }
    let song: Song, connection: ServerConnection, streamUrl;
    try {
      ({song, connection} = await this.getSongFromTrack(track));
      streamUrl = this.#appendTrackTypeToStreamUrl(this.#getStreamUrl(song, connection), track.trackType);
    }
    catch (error: any) {
      jellyfin.getLogger().error(`[jellyfin-play] Prefetch failed: ${error}`);
      jellyfin.getStateMachine().prefetchDone = false;
      return;
    }
    this.#monitoredPlaybacks.pending = { song, connection, streamUrl, timer: new StopWatch() };
    const mpdPlugin = this.#mpdPlugin;
    const res = await kewToJSPromise(mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, [])
      .then((addIdResp: {Id: string}) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        jellyfin.getLogger().info(`[jellyfin-play] Prefetched and added song to MPD queue: ${song.name}`);
        return mpdPlugin.sendMpdCommand('consume 1', []);
      }));

    this.#prefetchPlaybackStateFixer?.notifyPrefetched(track);

    return res;
  }

  // Returns kew promise!
  #mpdAddTags(mpdAddIdResponse: { Id: string }, track: ExplodedTrackInfo) {
    const songId = mpdAddIdResponse?.Id;
    // Set tags so that songs show the same title, album and artist as Jellyfin.
    // For songs that do not have metadata - either because it's not provided or the
    // Song format does not support it - mpd will return different info than Jellyfin if we do
    // Not set these tags beforehand. This also applies to DSFs - even though they support
    // Metadata, mpd will not read it because doing so incurs extra overhead and delay.
    if (songId !== undefined) {
      const cmdAddTitleTag = {
        command: 'addtagid',
        parameters: [ songId, 'title', track.title ]
      };
      const cmdAddAlbumTag = {
        command: 'addtagid',
        parameters: [ songId, 'album', track.album ]
      };
      const cmdAddArtistTag = {
        command: 'addtagid',
        parameters: [ songId, 'artist', track.artist ]
      };

      return this.#mpdPlugin.sendMpdCommandArray([ cmdAddTitleTag, cmdAddAlbumTag, cmdAddArtistTag ]);
    }
    return libQ.resolve();
  }

  #getStreamUrl(song: Song, connection: ServerConnection): string {
    const source = song.mediaSources?.[0];
    const stream = source?.MediaStreams?.[0];
    if (!stream || !source) {
      throw Error(`No media streams found for song ${song.name}`);
    }

    const container = source.Container ? `.${source.Container}` : '';
    const path = `/Audio/${song.id}/stream${container}`;
    const pathUrlObj = new URL(path, connection.api.basePath);

    pathUrlObj.searchParams.set('static', 'true');
    if (source.Id) {
      pathUrlObj.searchParams.set('mediaSourceId', source.Id);
    }
    if (source.ETag) {
      pathUrlObj.searchParams.set('tag', source.ETag);
    }
    const streamUrl = pathUrlObj.toString();
    const safeUri = streamUrl.replace(/"/g, '\\"');

    jellyfin.getLogger().info(`[jellyfin-play] Stream URL for ${song.name}: ${safeUri}`);

    return safeUri;
  }

  // Returns kew promise!
  #doPlay(streamUrl: string, track: ExplodedTrackInfo) {
    const mpdPlugin = this.#mpdPlugin;

    return mpdPlugin.sendMpdCommand('stop', [])
      .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
      })
      .then(() => {
        return mpdPlugin.sendMpdCommand(`load "${streamUrl}"`, []);
      })
      .fail(() => {
        // Send 'addid' command instead of 'add' to get mpd's Id of the song added.
        // We can then add tags using mpd's song Id.
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
      })
      .then((addIdResp: {Id: string}) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        jellyfin.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      });
  }

  async #markPlayed(song: Song, connection: ServerConnection): Promise<void> {
    const playstateApi = getPlaystateApi(connection.api);
    try {
      if (!connection.auth?.User?.Id) {
        throw Error('No auth');
      }
      await playstateApi.markPlayedItem({
        userId: connection.auth.User.Id,
        itemId: song.id,
        datePlayed: (new Date()).toUTCString()
      });
      jellyfin.getLogger().info(`[jellyfin-play]: Mark song ${song.name} as played by ${connection.auth.User.Name}.`);
    }
    catch (error: any) {
      jellyfin.getLogger().info(`[jellyfin-play]: Failed to mark song ${song.name} as played: ${error.message}`);
    }
  }

  async getSongFromTrack(track: ExplodedTrackInfo): Promise<{song: Song, connection: ServerConnection}> {
    const views = ViewHelper.getViewsFromUri(track.uri);
    const maybeSongView = views.pop() as any;
    const { songId, username, serverId } = maybeSongView;

    if (!songId || !username || !serverId) {
      throw Error(`Invalid track uri: ${track.uri}`);
    }

    const targetServer = ServerHelper.getOnlineServerByIdAndUsername(serverId, username);
    if (!targetServer) {
      throw Error('Server unavailable');
    }

    const connection = await this.#connectionManager.getAuthenticatedConnection(
      targetServer, username, ServerHelper.fetchPasswordFromConfig.bind(ServerHelper));
    const model = Model.getInstance(ModelType.Song, connection);
    const song = await model.getSong(songId);

    if (!song) {
      throw Error(`Failed to obtain song from track uri: ${track.uri}`);
    }

    return {
      song,
      connection
    };
  }

  #millisecondsToTicks(seconds: number) {
    return seconds * 10000;
  }

  async #apiReportPlayback(params: ApiReportPlaybackParams): Promise<void> {
    const { type, song, connection, seek } = params;
    const positionTicks = this.#millisecondsToTicks(seek);
    try {
      if (!connection.auth?.User?.Id) {
        throw Error('No auth');
      }
      const playstateApi = getPlaystateApi(connection.api);
      if (type === 'start') {
        await playstateApi.reportPlaybackStart({
          playbackStartInfo: {
            ItemId: song.id,
            PositionTicks: positionTicks
          }
        });
      }
      else if (type === 'stop') {
        await playstateApi.reportPlaybackStopped({
          playbackStopInfo: {
            ItemId: song.id,
            PositionTicks: positionTicks
          }
        });
      }
      else if (type === 'pause') {
        await playstateApi.reportPlaybackProgress({
          playbackProgressInfo: {
            ItemId: song.id,
            IsPaused: true,
            PositionTicks: positionTicks
          }
        });
      }
      else if (type === 'unpause') {
        await playstateApi.reportPlaybackProgress({
          playbackProgressInfo: {
            ItemId: song.id,
            IsPaused: false,
            PositionTicks: positionTicks
          }
        });
      }
      else { // Type: timeupdate
        await playstateApi.reportPlaybackProgress({
          playbackProgressInfo: {
            ItemId: song.id,
            PositionTicks: positionTicks
          }
        });
      }
      jellyfin.getLogger().info(`[jellyfin-play]: Reported '${type}' for song: ${song.name} (at ${seek} ms)`);
    }
    catch (error: any) {
      jellyfin.getLogger().error(`[jellyfin-play]: Failed to report '${type}' for song '${song.name}': ${error.message}`);
    }
  }

  async #handleMpdPlayerEvent() {

    const __apiReportPlayback = (playbackInfo: Required<PlaybackInfo> &
      { lastReport?: LastPlaybackReport, timer: StopWatch }, currentStatus: MpdState['status']) => {
      const reportPayload = {
        song: playbackInfo.song,
        connection: playbackInfo.connection
      };
      const lastStatus = playbackInfo.lastStatus;
      playbackInfo.lastStatus = currentStatus;
      let reportType: ApiReportPlaybackParams['type'];
      let seek;
      switch (currentStatus) {
        case 'pause':
          reportType = 'pause';
          playbackInfo.timer.stop();
          seek = mpdState.seek;
          break;

        case 'play':
          if (lastStatus === 'pause') {
            reportType = 'unpause';
          }
          else if (lastStatus === 'play') {
            reportType = 'timeupdate';
          }
          else { // LastStatus: stop
            reportType = 'start';
          }
          seek = mpdState.seek;
          playbackInfo.timer.start(seek);
          break;

        case 'stop':
        default:
          reportType = 'stop';
          // For 'stop' events, MPD state does not include the seek position.
          // We would have to get this value from playbackInfo's internal timer.
          seek = playbackInfo.timer.stop().getElapsed();
      }
      // Avoid multiple reports of same type
      if (playbackInfo.lastReport?.type === reportType &&
          (reportType !== 'timeupdate' || playbackInfo.lastReport?.seek === seek)) {
        return;
      }
      playbackInfo.lastReport = { type: reportType, seek };
      return this.#apiReportPlayback({...reportPayload, seek, type: reportType});
    };

    const __refreshPlayerViewHeartIcon = (favorite: boolean) => {
      jellyfin.getStateMachine().emitFavourites({ favourite: favorite });
    };

    const mpdState: MpdState = await kewToJSPromise(this.#mpdPlugin.getState());
    // Current stream has not changed
    if (mpdState.uri === this.#monitoredPlaybacks.current?.streamUrl) {
      __refreshPlayerViewHeartIcon(this.#monitoredPlaybacks.current.song.favorite);
      await __apiReportPlayback(this.#monitoredPlaybacks.current, mpdState.status);
    }
    // Stream previously fetched by the plugin and pending playback is now played
    else if (mpdState.uri === this.#monitoredPlaybacks.pending?.streamUrl) {
      const pending = this.#monitoredPlaybacks.pending;
      __refreshPlayerViewHeartIcon(pending.song.favorite);
      if (this.#monitoredPlaybacks.current && this.#monitoredPlaybacks.current.lastStatus !== 'stop') {
        await __apiReportPlayback(this.#monitoredPlaybacks.current, 'stop');
      }
      this.#monitoredPlaybacks.current = {
        ...pending,
        lastStatus: 'stop'
      };
      this.#monitoredPlaybacks.pending = null;
      await __apiReportPlayback(this.#monitoredPlaybacks.current, mpdState.status);
    }
    // Current stream has changed to one that was not loaded by the plugin
    else if (this.#monitoredPlaybacks.current && this.#monitoredPlaybacks.current.lastStatus !== 'stop') {
      await __apiReportPlayback(this.#monitoredPlaybacks.current, 'stop');
    }
  }
}

/**
 * VolumioPushStateListener exists only to call StateMachine's checkFavourites() when active service changes from 'jellyfin'.
 * The `checkFavorites()` method which will then refresh the 'heart' icon based on whether `state.uri` exists in Volumio favorites.
 * This method is supposed to be called within StateMachine's `pushState()`, but this never happens because it is chained to
 * Volumio commandRouter's `volumioPushState()`, which returns a promise that never resolves due to rest_api plugin not returning a promise
 * within its own pushState().
 * We only call `checKFavourites()` when the service has changed from 'jellyfin' to something else. This is to reinstate the 'heart' icon
 * to Volumio's default behaviour (which should always be 'off' given its current broken implementation).
 */
class VolumioPushStateListener {

  #lastState: any | null;

  constructor() {
    this.#lastState = null;
  }

  handleVolumioPushState(state: any) {
    if (this.#lastState?.service === 'jellyfin' && state.service !== 'jellyfin') {
      jellyfin.getStateMachine().checkFavourites(state);
    }
    this.#lastState = state;
  }
}

/**
 * (Taken from YouTube Music plugin)
 * https://github.com/patrickkfkan/volumio-ytmusic/blob/master/src/lib/controller/play/PlayController.ts
 *
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
  #prefetchedTrack: ExplodedTrackInfo | null;
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

  notifyPrefetched(track: ExplodedTrackInfo) {
    this.#positionAtPrefetch = jellyfin.getStateMachine().currentPosition;
    this.#prefetchedTrack = track;
    this.#addPushStateListener();
  }

  notifyPrefetchCleared() {
    this.#removePushStateListener();
  }

  #addPushStateListener() {
    if (!this.#volumioPushStateListener) {
      this.#volumioPushStateListener = this.#handleVolumioPushState.bind(this);
      jellyfin.volumioCoreCommand?.addCallback('volumioPushState', this.#volumioPushStateListener);
    }
  }

  #removePushStateListener() {
    if (this.#volumioPushStateListener) {
      const listeners = jellyfin.volumioCoreCommand?.callbacks?.['volumioPushState'] || [];
      const index = listeners.indexOf(this.#volumioPushStateListener);
      if (index >= 0) {
        jellyfin.volumioCoreCommand.callbacks['volumioPushState'].splice(index, 1);
      }
      this.#volumioPushStateListener = null;
      this.#positionAtPrefetch = -1;
      this.#prefetchedTrack = null;
    }
  }

  #handleVolumioPushState(state: any) {
    const sm = jellyfin.getStateMachine();
    const currentPosition = sm.currentPosition as number;
    if (sm.getState().service !== 'jellyfin') {
      this.#removePushStateListener();
      return;
    }
    if (this.#positionAtPrefetch >= 0 && this.#positionAtPrefetch !== currentPosition) {
      const track = sm.getTrack(currentPosition);
      const pf = this.#prefetchedTrack;
      this.#removePushStateListener();
      if (track && state && pf && track.service === 'jellyfin' && pf.uri === track.uri) {
        if (state.uri !== track.uri) {
          const mpdPlugin = jellyfin.getMpdPlugin();
          mpdPlugin.getState().then((st: any) => mpdPlugin.pushState(st));
        }
        this.emit('playPrefetch', {
          track: pf,
          position: currentPosition
        });
      }
    }
  }

  emit(event: 'playPrefetch', info: { track: ExplodedTrackInfo; position: number; }): boolean;
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: 'playPrefetch', listener: (info: { track: ExplodedTrackInfo; position: number; }) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
