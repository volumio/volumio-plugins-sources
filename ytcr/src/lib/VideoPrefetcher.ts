import AbortController from 'abort-controller';
import EventEmitter from 'events';
import { Logger, Video } from 'yt-cast-receiver';
import VideoLoader from './VideoLoader';

export default class VideoPrefetcher extends EventEmitter {

  #videoLoader: VideoLoader;
  #startPrefetchTimer: NodeJS.Timeout | null;
  #prefetchVideoAbortController: AbortController | null;
  #target: Video | null;
  #logger: Logger;

  constructor(videoLoader: VideoLoader, logger: Logger) {
    super();
    this.#videoLoader = videoLoader;
    this.#startPrefetchTimer = null;
    this.#prefetchVideoAbortController = null;
    this.#target = null;
    this.#logger = logger;
  }

  startPrefetchOnTimeout(video: Video, seconds: number) {
    this.abortPrefetch();
    this.#startPrefetchTimer = setTimeout(this.#prefetch.bind(this, video), seconds * 1000);
    this.#target = video;
    this.#logger.debug(`[ytcr] Going to prefetch ${video.id} in ${seconds}s`);
  }

  async #prefetch(video: Video) {
    this.#clearPrefetchTimer();
    this.#prefetchVideoAbortController = new AbortController();
    try {
      this.#logger.debug(`[ytcr] Begin prefetching ${video.id}...`);
      const videoInfo = await this.#videoLoader.getInfo(video, this.#prefetchVideoAbortController.signal);
      this.#logger.debug(`[ytcr] Prefetched info for ${video.id}:`, videoInfo);
      this.emit('prefetch', videoInfo);
    }
    catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.#logger.debug(`[ytcr] Prefetch aborted for ${video.id}`);
      }
      else {
        this.#logger.error(`[ytcr] Failed to prefetch ${video.id}:`, error);
      }
    }
    finally {
      this.#prefetchVideoAbortController = null;
      if (!this.isPending()) {
        this.#target = null;
      }
    }
  }

  abortPrefetch() {
    this.#clearPrefetchTimer();
    if (this.#prefetchVideoAbortController) {
      this.#prefetchVideoAbortController.abort();
      this.#prefetchVideoAbortController = null;
    }
    this.#target = null;
  }

  #clearPrefetchTimer() {
    if (this.#startPrefetchTimer) {
      clearTimeout(this.#startPrefetchTimer);
      this.#startPrefetchTimer = null;
    }
  }

  isPrefetching(): boolean {
    return !!this.#prefetchVideoAbortController;
  }

  isPending(): boolean {
    return !!this.#startPrefetchTimer;
  }

  getCurrentTarget(): Video | null {
    return this.#target;
  }
}
