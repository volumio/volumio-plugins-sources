import { Constants, PLAYLIST_EVENT_TYPES, Player, PlayerState, Video, Volume } from 'yt-cast-receiver';
import mpdApi, { MPDApi } from 'mpd-api';
import { MPD } from 'mpd2';
import AbortController from 'abort-controller';
import MPDSubsystemEventEmitter, { SubsystemEvent, SubsystemName } from './MPDSubsystemEventEmitter.js';
import VolumeControl from './VolumeControl.js';
import VideoLoader, { VideoInfo } from './VideoLoader.js';
import ytcr from './YTCRContext.js';
import VideoPrefetcher from './VideoPrefetcher.js';

export interface MPDPlayerError {
  message: string;
}

export interface ActionEvent {
  name: 'play' | 'pause' | 'resume' | 'stop' | 'seek' | 'setVolume';
  data?: Record<string, any>;
}

export interface MPDPlayerConfig {
  mpd: MPD.Config;
  volumeControl: VolumeControl;
  videoLoader: VideoLoader;
  prefetch: boolean;
}

export interface MPDPlayerVideoInfo extends VideoInfo {
  mpdSongId: string;
}

interface MPDStatus {
  repeat: boolean,
  random: boolean,
  single: boolean,
  consume: boolean,
  playlist: number,
  playlistlength: number,
  mixrampdb: number,
  state: 'play' | 'pause' | 'stop',
  song: number,
  songid: number,
  time: { elapsed: number, total: number },
  elapsed: number,
  bitrate: string,
  duration: number,
  audio: {
    sample_rate: number,
    bits: string,
    channels: number,
    sample_rate_short: { value: number, unit: string },
    original_value: string
  }
}

export interface VolumioState {
  service: string;
  status: 'play' | 'pause' | 'stop';
  title?: string;
  artist?: string;
  album?: string;
  albumart: string;
  uri: string;
  trackType: string;
  seek?: number;
  duration: number;
  samplerate?: string;
  bitdepth?: string;
  bitrate?: string;
  channels?: number;
  volume: number;
  mute: boolean;
  isStreaming?: boolean;
}

export default class MPDPlayer extends Player {

  #config: MPDPlayerConfig;
  #currentVideoInfo: MPDPlayerVideoInfo | null;
  #prefetchedAndQueuedVideoInfo: MPDPlayerVideoInfo | null;
  #prefetchedVideoExpiryTimer: NodeJS.Timeout | null;
  #mpdClient: MPDApi.ClientAPI | null;
  #mpdClientInitTimer: NodeJS.Timeout | null;
  #volumeControl: VolumeControl;
  #videoLoader: VideoLoader;
  #loadVideoAbortController: AbortController | null;
  #videoPrefetcher: VideoPrefetcher | null;
  #playlistEventListener: () => void;
  #autoplayModeChangeListener: () => void;

  #subsystemEventEmitter: MPDSubsystemEventEmitter | null;
  #destroyed: boolean;
  #asleep: boolean;

  constructor(config: MPDPlayerConfig) {
    super();
    this.#config = config;
    this.#mpdClientInitTimer = null;
  }

  // Must be called after receiver started, not before.
  async init() {
    this.#currentVideoInfo = null;
    this.#destroyed = false;
    this.#videoLoader = this.#config.videoLoader;
    this.#videoPrefetcher = this.#config.prefetch ? new VideoPrefetcher(this.#videoLoader, this.logger) : null;
    this.#volumeControl = this.#config.volumeControl;

    this.#initMPDClient();

    this.#playlistEventListener = this.#handlePlaylistEvent.bind(this);
    Object.values(PLAYLIST_EVENT_TYPES).forEach((event: any) => {
      this.queue.on(event, this.#playlistEventListener);
    });

    this.#autoplayModeChangeListener = this.#handleAutoplayModeChange.bind(this);
    this.queue.on('autoplayModeChange', this.#autoplayModeChangeListener);
  }

  #clearMPDClientInitTimer() {
    if (this.#mpdClientInitTimer) {
      clearTimeout(this.#mpdClientInitTimer);
      this.#mpdClientInitTimer = null;
    }
  }

  async #initMPDClient() {
    this.#clearMPDClientInitTimer();
    if (this.#mpdClient) {
      return;
    }
    try {
      this.#mpdClient = await mpdApi.connect(this.#config.mpd);
    }
    catch (error) {
      this.logger.error('[ytcr] Error connecting MPD:', error, ' Retrying in 5 seconds...');
      this.#mpdClientInitTimer = setTimeout(() => {
        if (!this.#destroyed) {
          this.#initMPDClient();
        }
      }, 5000);
      return;
    }

    this.logger.debug('[ytcr] MPD connected');

    this.#mpdClient.once('close', async () => {
      this.#mpdClient = null;
      this.#subsystemEventEmitter?.destroy();
      if (this.#destroyed) {
        return;
      }
      await this.#clearPrefetch();
      this.#currentVideoInfo = null;
      await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.STOPPED);
      this.sleep();
      this.logger.debug('[ytcr] MPD disconnected. Reconnecting...');
      this.#initMPDClient();
    });

    const externalMPDEventListener = this.#handleExternalMPDEvent.bind(this);
    this.#subsystemEventEmitter = MPDSubsystemEventEmitter.instance(this.#mpdClient, this.logger);
    this.#subsystemEventEmitter.on('player', externalMPDEventListener);
    this.#subsystemEventEmitter.on('mixer', externalMPDEventListener);
    this.#subsystemEventEmitter.enable();
  }

  #abortLoadVideo() {
    if (this.#loadVideoAbortController) {
      this.#loadVideoAbortController.abort();
      this.#loadVideoAbortController = null;
    }
  }

  protected async doPlay(video: Video, position: number): Promise<boolean> {
    if (this.#destroyed || !this.#mpdClient) {
      return false;
    }

    await this.#clearPrefetch();

    this.emit('action', { name: 'play', data: { videoId: video.id, position } });
    this.logger.debug(`[ytcr] MPDPlayer: play ${video.id} at position ${position}s`);

    this.#abortLoadVideo();
    this.#loadVideoAbortController = new AbortController();
    let videoInfo;
    try {
      videoInfo = await this.#videoLoader.getInfo(video, this.#loadVideoAbortController.signal) as MPDPlayerVideoInfo;
    }
    catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.debug('[ytcr] AbortError:', error);
        return false;
      }
      throw error;
    }
    finally {
      this.#loadVideoAbortController = null;
    }
    this.logger.debug(`[ytcr] MPDPLayer obtained info for ${video.id}:`, videoInfo);

    await this.#mpdClient.api.queue.clear();

    if (videoInfo) {
      const songId = await this.#addToMPDQueue(videoInfo);
      if (songId) {
        videoInfo.mpdSongId = songId;
        await this.#mpdClient.api.playback.seekid(songId, position.toString());

        this.wake();

        const resolved = await this.resolveOnMPDStatusChanged(
          this.#mpdClient.api.playback.playid.bind(this, songId), 'player',
          { state: 'play', songid: videoInfo.mpdSongId }
        );

        if (resolved.result) { // Playback successful
          this.#currentVideoInfo = videoInfo;
          this.#checkAndStartPrefetch(resolved.mpdStatus);
        }

        return resolved.result;
      }
    }

    this.logger.debug(`[ytcr] MPDPlayer failed to play ${video.id}: ${videoInfo.errMsg}`);
    this.emit('error', {
      message: ytcr.getI18n('YTCR_START_PLAYBACK_FAILED', videoInfo.title || videoInfo.id, videoInfo.errMsg)
    } as MPDPlayerError);

    // Check if video was in fact loaded (just that it's unplayable) - this affects whether we're going to play next.
    if (videoInfo?.title) {
      this.logger.debug('[ytcr] Video unplayable; proceeding to next in queue...');
      return this.next();
    }

    return false;
  }

  async #addToMPDQueue(videoInfo: VideoInfo): Promise<string | null> {
    if (this.#destroyed || !this.#mpdClient) {
      return null;
    }
    if (videoInfo.streamUrl) {
      const songId = (await this.#mpdClient.api.queue.addid(videoInfo.streamUrl)).toString();
      if (videoInfo.title) {
        await this.#mpdClient.api.queue.addtagid(songId, 'title', videoInfo.title);
      }
      const album = videoInfo.album || videoInfo.channel;
      if (album) {
        await this.#mpdClient.api.queue.addtagid(songId, 'album', album);
      }
      await this.#mpdClient.api.queue.addtagid(songId, 'artist', videoInfo.artist || 'YouTube Cast');
      await this.#mpdClient.api.playback.consume('1');

      return songId;
    }

    return null;
  }

  // Overrides
  async next(AID?: number | null | undefined): Promise<boolean> {
    // If prefetched video already added to MPD queue, tell MPD to play it instead of going through the original next() workflow.
    // This will trigger an external MPD event which will be dealt with in #handleExternalMPDEvent().
    const queueState = this.queue.getState();
    const nextVideo = queueState.next || queueState.autoplay;
    if (nextVideo && this.#prefetchedAndQueuedVideoInfo?.id === nextVideo.id && this.#mpdClient) {
      this.logger.debug(`[ytcr] Playing prefetched video from MPD queue: ${nextVideo.id}`);
      await this.#mpdClient.api.playback.playid(this.#prefetchedAndQueuedVideoInfo.mpdSongId);
      return true;
    }

    // Original workflow
    await this.#clearPrefetch();
    return super.next(AID);
  }

  protected async doPause(): Promise<boolean> {
    if (this.#destroyed || !this.#mpdClient || !this.#currentVideoInfo?.mpdSongId) {
      return false;
    }

    await this.#cancelPrefetch();

    this.emit('action', { name: 'pause' });

    this.logger.debug('[ytcr] MPDPlayer: pause');

    const resolve = await this.resolveOnMPDStatusChanged(
      this.#mpdClient.api.playback.pause.bind(this), 'player',
      { state: 'pause', songid: this.#currentVideoInfo.mpdSongId }
    );

    return resolve.result;
  }

  protected async doResume(): Promise<boolean> {
    if (this.#destroyed || !this.#mpdClient || !this.#currentVideoInfo?.mpdSongId) {
      return false;
    }

    this.emit('action', { name: 'resume' });

    this.logger.debug('[ytcr] MPDPlayer: resume');

    const resolve = await this.resolveOnMPDStatusChanged(
      this.#mpdClient.api.playback.resume.bind(this), 'player',
      { state: 'play', songid: this.#currentVideoInfo.mpdSongId }
    );

    if (resolve.result) {
      this.#checkAndStartPrefetch(resolve.mpdStatus);
    }

    return resolve.result;
  }

  protected async doStop(): Promise<boolean> {
    if (this.#destroyed || !this.#mpdClient) {
      return true;
    }

    await this.#clearPrefetch();

    if (this.status === Constants.PLAYER_STATUSES.LOADING) {
      this.#abortLoadVideo();
      return true;
    }

    this.emit('action', { name: 'stop' });

    this.logger.debug('[ytcr] MPDPlayer: stop');

    const resolved = await this.resolveOnMPDStatusChanged(
      this.#mpdClient.api.playback.stop.bind(this), 'player',
      { state: 'stop' }
    );

    if (resolved.result) { // Stopped
      this.#currentVideoInfo = null;
    }

    return resolved.result;
  }

  protected async doSeek(position: number): Promise<boolean> {
    if (this.#destroyed || !this.#mpdClient || !this.#currentVideoInfo?.mpdSongId) {
      return false;
    }

    await this.#cancelPrefetch();

    // Seeking not supported for livestreams
    if (this.#currentVideoInfo.isLive) {
      this.logger.debug('[ytcr] MPDPlayer playing livestream; seek request ignored.');
      return false;
    }

    this.emit('action', { name: 'seek', data: { position } });

    this.logger.debug(`[ytcr] MPDPlayer: seek to ${position}s`);

    const resolve = await this.resolveOnMPDStatusChanged(
      this.#mpdClient.api.playback.seekcur.bind(this, position.toString()), 'player',
      { songid: this.#currentVideoInfo.mpdSongId }
    );

    if (resolve.result) {
      this.#checkAndStartPrefetch(resolve.mpdStatus);
    }

    return resolve.result;
  }

  protected async doSetVolume(volume: Volume): Promise<boolean> {
    if (this.#asleep || this.#destroyed) {
      return false;
    }

    this.emit('action', { name: 'setVolume', data: { volume } });

    if (this.#asleep || this.#destroyed) {
      return false;
    }

    this.logger.debug('[ytcr] MPDPlayer: set volume to:', volume);
    this.#volumeControl.setVolume(volume);

    return true;
  }

  protected doGetVolume(): Promise<Volume> {
    return this.#volumeControl.getVolume();
  }

  protected async doGetPosition(): Promise<number> {
    if (this.#asleep || this.#destroyed || !this.#mpdClient) {
      return 0;
    }

    if (this.#currentVideoInfo?.isLive) {
      return 600;
    }

    const mpdStatus = await this.#mpdClient.api.status.get<MPDStatus>();
    return mpdStatus.elapsed || 0;
  }

  protected async doGetDuration(): Promise<number> {
    if (this.#asleep || this.#destroyed || !this.#mpdClient) {
      return 0;
    }

    if (this.#currentVideoInfo?.isLive) {
      return 600;
    }

    const mpdStatus = await this.#mpdClient.api.status.get<MPDStatus>();
    return mpdStatus.duration || 0;
  }

  async enablePrefetch(value: boolean) {
    if (value === this.#config.prefetch) {
      return;
    }

    if (value) {
      this.#videoPrefetcher = new VideoPrefetcher(this.#videoLoader, this.logger);
      if ((this.status === Constants.PLAYER_STATUSES.PAUSED || this.status === Constants.PLAYER_STATUSES.PLAYING) && this.#mpdClient) {
        const mpdStatus = await this.#mpdClient.api.status.get<MPDStatus>();
        this.#checkAndStartPrefetch(mpdStatus);
      }
    }
    else {
      await this.#clearPrefetch();
      this.#videoPrefetcher = null;
    }

    this.#config.prefetch = value;
  }

  async #handlePlaylistEvent() {
    const queueState = this.queue.getState();
    if (!queueState.current?.id || this.#currentVideoInfo?.id !== queueState.current.id) {
      // Skip handling if:
      // 1. Current video is `null`, meaning doStop() will be called if player is playing. We will clear prefetching there; or
      // 2. Current video has changed, meaning doPlay() will be called. We will handle prefetching there.
      return;
    }
    // Same video so doPlay() / doStop() will not be called.
    // But playlist could have been updated so that the next / autoplay video is different. Need to refresh prefetch as ncessary.
    await this.#refreshPrefetch();
  }

  async #handleAutoplayModeChange() {
    await this.#refreshPrefetch();
  }

  async #refreshPrefetch() {
    const queueState = this.queue.getState();
    if (this.#videoPrefetcher) {
      const nextVideo = queueState.next || queueState.autoplay;
      const prefetcherTarget = this.#prefetchedAndQueuedVideoInfo || this.#videoPrefetcher.getCurrentTarget();
      if (!nextVideo || prefetcherTarget?.id !== nextVideo.id) {
        await this.#clearPrefetch();
        if (nextVideo && this.#mpdClient) {
          this.logger.debug(`[ytcr] Refreshing prefetcher (previous target -> current: ${prefetcherTarget?.id} -> ${nextVideo.id})`);
          const mpdStatus = await this.#mpdClient.api.status.get<MPDStatus>();
          this.#checkAndStartPrefetch(mpdStatus);
        }
      }
    }
  }

  #checkAndStartPrefetch(mpdStatus: MPDStatus) {
    if (!this.#videoPrefetcher || !this.#currentVideoInfo || this.#currentVideoInfo.isLive) {
      return;
    }
    if (this.#prefetchedAndQueuedVideoInfo || this.#videoPrefetcher.isPrefetching()) {
      return;
    }
    const timeRemaining = mpdStatus.duration - mpdStatus.elapsed;
    if (timeRemaining > 10) {
      const queueState = this.queue.getState();
      const nextVideo = queueState.next || queueState.autoplay;
      if (nextVideo) {
        this.#videoPrefetcher.removeAllListeners('prefetch');
        this.#videoPrefetcher.once('prefetch', this.#handlePrefetchedVideo.bind(this));
        this.#videoPrefetcher.startPrefetchOnTimeout(nextVideo, timeRemaining - 10);
      }
    }
  }

  async #cancelPrefetch(abortIfPrefetching = false, clearIfPrefetched = false) {
    if (!this.#videoPrefetcher) { // Prefetch disabled
      return;
    }

    this.logger.debug(`[ytcr] Cancelling prefetch (abortIfPrefetching: ${abortIfPrefetching}, clearIfPrefetched: ${clearIfPrefetched})`);

    if (!this.#videoPrefetcher.isPrefetching() || abortIfPrefetching) {
      this.#videoPrefetcher.abortPrefetch();
      this.#videoPrefetcher.removeAllListeners('prefetch');
    }

    if (this.#prefetchedAndQueuedVideoInfo?.mpdSongId && this.#mpdClient && clearIfPrefetched) {
      try {
        await this.#mpdClient.api.queue.deleteid(this.#prefetchedAndQueuedVideoInfo.mpdSongId);
      }
      catch (error: any) {
        this.logger.error(`[ytcr] Failed to remove prefetched song from MPD queue (song Id ${this.#prefetchedAndQueuedVideoInfo.mpdSongId}):`, error);
      }
      finally {
        this.#clearPrefetchedVideoExpiryTimer();
      }
    }

    if (clearIfPrefetched) {
      this.#prefetchedAndQueuedVideoInfo = null;
    }
  }

  #clearPrefetch() {
    return this.#cancelPrefetch(true, true);
  }

  #clearPrefetchedVideoExpiryTimer() {
    if (this.#prefetchedVideoExpiryTimer) {
      clearTimeout(this.#prefetchedVideoExpiryTimer);
      this.#prefetchedVideoExpiryTimer = null;
    }
  }

  async #handlePrefetchedVideo(videoInfo: VideoInfo) {
    if (this.#destroyed || !this.#mpdClient) {
      return;
    }
    const queueState = this.queue.getState();
    const nextVideo = queueState.next || queueState.autoplay;
    if (nextVideo?.id === videoInfo.id) {
      if (videoInfo) {
        const songId = await this.#addToMPDQueue(videoInfo);
        if (songId) {
          this.#prefetchedAndQueuedVideoInfo = {
            ...videoInfo,
            mpdSongId: songId
          };
          this.logger.debug(`[ytcr] Prefetched video ${videoInfo.id} added to MPD queue with song Id: ${songId}`);

          if (videoInfo.streamExpires) {
            const expiryMS = videoInfo.streamExpires.getTime() - Date.now();
            if (expiryMS > 0) {
              this.logger.debug(`[ytcr] Stream URL of prefetched video ${videoInfo.id} is going to expire in ${expiryMS / 1000}s`);
              this.#prefetchedVideoExpiryTimer = setTimeout(async () => {
                this.logger.debug(`[ytcr] Stream URL of prefetched video ${videoInfo.id} is about to expire.`);
                if (this.#mpdClient) {
                  this.logger.debug(`[ytcr] Removing it from MPD queue (song Id: ${songId})...`);
                  try {
                    await this.#mpdClient.api.queue.deleteid(songId);
                  }
                  catch (error: any) {
                    this.logger.error(`[ytcr] Failed to remove expired prefetched song from MPD queue (song Id ${songId}):`, error);
                  }
                  finally {
                    this.#prefetchedVideoExpiryTimer = null;
                  }
                }
              }, expiryMS - 60000);
            }
          }
        }
        else {
          this.logger.debug(`[ytcr] Failed to add prefetched video ${videoInfo.id} to MPD queue: MPD did not return a song Id.`);
        }
      }
    }
    else {
      this.logger.debug(`[ytcr] Prefetched video Id ${videoInfo.id} does not match next in queue (${nextVideo?.id})`);
    }
  }

  async destroy() {
    this.#destroyed = true;
    this.#clearMPDClientInitTimer();
    this.#subsystemEventEmitter?.destroy();
    await this.stop();
    await this.#mpdClient?.disconnect();
    this.removeAllListeners();

    Object.values(PLAYLIST_EVENT_TYPES).forEach((event: any) => {
      this.queue.off(event, this.#playlistEventListener);
    });

    this.queue.off('autoplayModeChange', this.#autoplayModeChangeListener);

    this.#subsystemEventEmitter = null;
    this.#mpdClient = null;
    this.#currentVideoInfo = null;
    this.#asleep = true;
  }

  sleep() {
    if (!this.#asleep) {
      this.logger.debug('[ytcr] MPDPlayer going to sleep...');
      this.#asleep = true;
    }
  }

  wake() {
    if (this.#asleep) {
      this.logger.debug('[ytcr] MPDPlayer waking up...');
      this.#asleep = false;
    }
  }

  async #handleExternalMPDEvent(event: SubsystemEvent) {
    if (this.#asleep || this.#destroyed || !this.#mpdClient) {
      return;
    }

    this.logger.debug(`[ytcr] MPDPlayer received external MPD event for subsystem: ${event.name}.`);

    const mpdStatus = await this.#mpdClient.api.status.get<MPDStatus>();
    this.logger.debug('[ytcr] MPD status for subsystem event:', mpdStatus);

    // Prefetched video added to MPD queue and is now being played automatically by MPD when previous one has ended
    if (mpdStatus.state === 'play' && this.#prefetchedAndQueuedVideoInfo && mpdStatus.songid.toString() === this.#prefetchedAndQueuedVideoInfo.mpdSongId) {
      this.logger.debug('[ytcr] Playback of prefetched video started');
      this.#currentVideoInfo = this.#prefetchedAndQueuedVideoInfo;
      this.#clearPrefetchedVideoExpiryTimer();
      this.#prefetchedAndQueuedVideoInfo = null;
      await this.queue.next();
      await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.PLAYING);
      this.#checkAndStartPrefetch(mpdStatus);
      return;
    }

    if (!this.#currentVideoInfo || (this.#currentVideoInfo.mpdSongId !== mpdStatus.songid?.toString() && mpdStatus.state !== 'stop')) {
      this.logger.debug('[ytcr] MPD subsystem event does not match current song. Putting player to sleep...');
      await this.#clearPrefetch();
      this.#currentVideoInfo = null;
      await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.STOPPED);
      this.sleep();
      return;
    }

    if (event.name === 'mixer') {
      this.logger.debug('[ytcr] MPD subsystem event indicated volume change. Notifying senders of change...');
      await this.notifyExternalStateChange();
      //This.emit('volumeChanged', mpdStatus.volume)
      return;
    }

    if (event.name === 'player') {
      switch (mpdStatus.state) {
        case 'pause':
          await this.#cancelPrefetch();
          await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.PAUSED);
          break;
        case 'stop':
          await this.#clearPrefetch();
          await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.STOPPED);
          break;
        default:
          this.#checkAndStartPrefetch(mpdStatus);
          await this.notifyExternalStateChange(Constants.PLAYER_STATUSES.PLAYING);
      }

      //Let playerState = await this.getState(mpdStatus);
      if (mpdStatus.state === 'stop') {
        // In play(), we set consume on for mpd. If song is no longer in the queue,
        // That means it has finished playing
        let songIdInfo;
        try {
          if (this.#currentVideoInfo.mpdSongId) {
            songIdInfo = await this.#mpdClient.api.queue.id(this.#currentVideoInfo.mpdSongId);
          }
        }
        catch (error) {
          songIdInfo = null;
        }
        this.#currentVideoInfo = null;
        //Let playbackFinished = false;
        if (!songIdInfo) {
          this.logger.debug('[ytcr] Current playback finished.');
          await this.next();
        }
      }
    }
  }

  resolveOnMPDStatusChanged(action: () => Promise<void>, subsystem: SubsystemName, resolveOn: Record<string, string> = {}): Promise<{result: boolean, mpdStatus: MPDStatus}> {
    return new Promise((resolve) => {
      this.#subsystemEventEmitter?.prependOnceListener(subsystem,
        async (event) => {
          const mpdStatus: any = await this.#mpdClient?.api.status.get();
          let shouldResolve = true;
          for (const [ key, value ] of Object.entries(resolveOn)) {
            if (mpdStatus[key] === undefined || mpdStatus[key].toString() !== value.toString()) {
              shouldResolve = false;
              break;
            }
          }
          event.stopPropagation();
          if (shouldResolve) {
            this.logger.debug('[ytcr] Condition for resolveOnMPDStatusChanged() satisfied. Resolving Promise...');
            resolve({ result: true, mpdStatus });
          }
          else {
            this.logger.debug('[ytcr] MPD status:', mpdStatus, 'does not match condition:', resolveOn);
            this.logger.debug('[ytcr] Condition for resolveOnMPDStatusChanged() failed. Rejecting Promise...');
            resolve({ result: false, mpdStatus });
          }
        }
      );

      action();
    });
  }

  async getVolumioState(): Promise<VolumioState | null> {
    if (this.#asleep || this.#destroyed || !this.#mpdClient) {
      return null;
    }

    const mpdStatus: any = await this.#mpdClient.api.status.get<MPDStatus>();
    const volume: Volume = await this.#volumeControl.getVolume();

    if (!mpdStatus) {
      return null;
    }

    const state: VolumioState = {
      status: mpdStatus.state,
      service: 'ytcr',
      albumart: this.#currentVideoInfo?.thumbnail || '/albumart',
      uri: '',
      trackType: 'YouTube',
      seek: Math.round((mpdStatus.elapsed || 0) * 1000),
      duration: Math.round(mpdStatus.time?.total || 0),
      volume: volume.level,
      mute: volume.muted
    };

    const audio = mpdStatus?.audio;
    if (audio && !this.#currentVideoInfo?.bitrate) {
      if (audio.bits && audio.bits !== 'f') {
        state.bitdepth = `${audio.bits.toString()} bit`;
      }
      if (audio.sample_rate_short) {
        state.samplerate = `${audio.sample_rate_short.value} ${audio.sample_rate_short.unit}`;
      }
    }

    if (this.#currentVideoInfo) {
      state.title = this.#currentVideoInfo.title;
      state.artist = this.#currentVideoInfo.channel || this.#currentVideoInfo.artist;
      if (this.#currentVideoInfo.album) {
        state.album = this.#currentVideoInfo.album;
      }
      if (this.#currentVideoInfo.bitrate) {
        state.bitrate = this.#currentVideoInfo.bitrate;
      }
      if (this.#currentVideoInfo.channels) {
        state.channels = this.#currentVideoInfo.channels;
      }
      state.isStreaming = this.#currentVideoInfo.isLive;
      if (this.#currentVideoInfo.isLive) {
        state.duration = 0;
        state.seek = undefined;
      }

      const youtubeCastText = `YouTube Cast${this.#currentVideoInfo.isLive ? ' (Live)' : ''}`;
      if (state.bitdepth) {
        state.bitdepth = `${state.bitdepth} - ${youtubeCastText}`;
      }
      else if (state.samplerate) {
        state.samplerate = `${state.samplerate} - ${youtubeCastText}`;
      }
      else if (state.bitrate) {
        state.samplerate = `${state.bitrate} - ${youtubeCastText}`;
      }
      else {
        state.samplerate = youtubeCastText;
      }
      delete state.bitrate;
    }

    return state;
  }

  get videoLoader(): VideoLoader {
    return this.#videoLoader;
  }

  get currentVideo() {
    return this.#currentVideoInfo;
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'action', listener: (args: ActionEvent) => void): this;
  on(event: 'error', listener: (args: MPDPlayerError) => void): this;
  on(event: 'state', listener: (data: { AID: string; current: PlayerState; previous: PlayerState | null; }) => void): this;
  on(event: any, listener: any): this {
    super.on(event, listener);
    return this;
  }
}
