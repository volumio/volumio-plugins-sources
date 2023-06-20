import Endpoint from '../../../types/Endpoint';
import ExplodeHelper from '../../../util/ExplodeHelper';
import BaseViewHandler from './BaseViewHandler';
import View from './View';

export interface QueueItem {
  service: 'youtube2';
  uri: string;
  albumart?: string;
  artist?: string;
  album?: string;
  name: string;
  title: string;
  duration?: number;
  samplerate?: string;
}

export interface ExplodedTrackInfo {
  title: string;
  artist: string;
  albumart: string;
  endpoint: Endpoint;
}

export default abstract class ExplodableViewHandler<V extends View> extends BaseViewHandler<V> {

  async explode(): Promise<QueueItem[]> {
    const view = this.currentView;
    if (view.noExplode) {
      return [];
    }

    const tracks = await this.getTracksOnExplode();
    if (!Array.isArray(tracks)) {
      const trackInfo = ExplodeHelper.createQueueItemFromExplodedTrackInfo(tracks);
      return trackInfo ? [ trackInfo ] : [];
    }

    return tracks.map((info) => ExplodeHelper.createQueueItemFromExplodedTrackInfo(info));
  }

  protected abstract getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
