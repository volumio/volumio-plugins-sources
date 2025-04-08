import TrackEntity from '../../../entities/TrackEntity';
import ExplodeHelper from '../../../util/ExplodeHelper';
import BaseViewHandler from './BaseViewHandler';
import { TrackOrigin } from './TrackViewHandler';
import View from './View';

export interface QueueItem {
  service: 'soundcloud';
  uri: string;
  albumart?: string;
  artist?: string;
  album?: string;
  name: string;
  title: string;
  duration?: number;
  samplerate?: string;
}

export interface ExplodedTrackInfo extends TrackEntity {
  origin?: TrackOrigin;
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

    return tracks.reduce<QueueItem[]>((result, track) => {
      const qi = ExplodeHelper.createQueueItemFromExplodedTrackInfo(track);
      if (qi) {
        result.push(qi);
      }
      return result;
    }, []);
  }

  protected abstract getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
