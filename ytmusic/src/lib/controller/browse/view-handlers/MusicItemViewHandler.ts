import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';

export interface MusicItemView extends View {
  name: 'video' | 'song';
  explodeTrackData: ExplodedTrackInfo;
}

export default class MusicItemViewHandler extends ExplodableViewHandler<MusicItemView> {

  protected async getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    const explodeTrackData = this.currentView.explodeTrackData;

    if (!explodeTrackData) {
      throw Error('Operation not supported');
    }

    return explodeTrackData;
  }
}
