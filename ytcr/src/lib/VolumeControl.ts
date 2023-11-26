import { Logger, Volume } from 'yt-cast-receiver';
import { kewToJSPromise } from './Utils.js';

export interface VolumioVolume {
  vol: number;
  mute: boolean;
}

interface VolumioVolumeChangeListener {
  (volume: VolumioVolume): Promise<void>;
}

export default class VolumeControl {

  #commandRouter: any;
  #logger: Logger;
  #currentVolume: Volume | null;
  #volumioVolumeChangeListener: VolumioVolumeChangeListener | null;

  constructor(commandRouter: any, logger: Logger) {
    this.#commandRouter = commandRouter;
    this.#logger = logger;
    this.#currentVolume = null;
    this.#volumioVolumeChangeListener = null;
  }

  async init() {
    this.#currentVolume = await this.getVolume();
    this.#logger.debug('[ytcr] VolumeControl initialized with current volume:', this.#currentVolume);
  }

  async setVolume(volume: Volume, setInternalOnly = false) {
    const oldVolume = this.#currentVolume;
    this.#currentVolume = volume;
    if (!setInternalOnly) {
      try {
        if (oldVolume?.level !== volume.level) {
          this.#logger.debug(`[ytcr] VolumeControl setting Volumio's volume level to: ${volume.level}`);
          this.#commandRouter.volumiosetvolume(volume.level);
        }
        if (oldVolume?.muted !== volume.muted) {
          this.#logger.debug(`[ytcr] VolumeControl setting Volumio's mute status to: ${volume.muted}`);
          this.#commandRouter.volumiosetvolume(volume.muted ? 'mute' : 'unmute');
        }
      }
      catch (error) {
        this.#logger.error('[ytcr] Failed to set Volumio\'s volume:', error);
        this.#currentVolume = null;
      }
    }
  }

  async getVolume(): Promise<Volume> {
    if (this.#currentVolume === null) {
      try {
        const volumioVolume = await kewToJSPromise(this.#commandRouter.volumioretrievevolume());
        this.#currentVolume = {
          level: volumioVolume.vol,
          muted: volumioVolume.mute
        };
      }
      catch (error: any) {
        this.#logger.error('[ytcr] VolumeControl failed to obtain volume from Volumio:', error);
        this.#currentVolume = null;
        return {
          level: 0,
          muted: false
        };
      }
    }
    return this.#currentVolume;
  }

  registerVolumioVolumeChangeListener(listener: VolumioVolumeChangeListener) {
    if (this.#volumioVolumeChangeListener) {
      this.unregisterVolumioVolumeChangeListener();
    }
    this.#volumioVolumeChangeListener = listener;
    this.#commandRouter.addCallback('volumioupdatevolume', listener);
  }

  unregisterVolumioVolumeChangeListener() {
    if (!this.#volumioVolumeChangeListener) {
      return;
    }
    const callbacks = this.#commandRouter.callbacks['volumioupdatevolume'];
    if (callbacks) {
      const oldCount = callbacks.length;
      this.#logger.debug(`[ytcr] VolumeControl removing Volumio callbacks for 'volumioupdatevolume'. Current count: ${oldCount}`);
      this.#commandRouter.callbacks['volumioupdatevolume'] = callbacks.filter((l: any) => l !== this.#volumioVolumeChangeListener);
      const newCount = this.#commandRouter.callbacks['volumioupdatevolume'].length;
      this.#logger.debug(`[ytcr] VolumeControl removed ${oldCount - newCount} Volumio callbacks for 'volumioupdatevolume'.`);
    }
  }
}
