import ExplodableViewHandler, { type ExplodedTrackInfo } from './ExplodableViewHandler';
import type View from './View';

export interface MusicItemView extends View {
  name: 'video' | 'song';
  explodeTrackData: ExplodedTrackInfo;
}

export default class MusicItemViewHandler extends ExplodableViewHandler<MusicItemView> {

  protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    const explodeTrackData = this.currentView.explodeTrackData;

    if (!explodeTrackData) {
      throw Error('Operation not supported');
    }

    return Promise.resolve(explodeTrackData);
  }
}
