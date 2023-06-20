import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';

export interface VideoView extends View {
  name: 'video';
  explodeTrackData: ExplodedTrackInfo;
}

export default class VideoViewHandler extends ExplodableViewHandler<VideoView> {

  protected async getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    const explodeTrackData = this.currentView.explodeTrackData;

    if (!explodeTrackData) {
      throw Error('Operation not supported');
    }

    return explodeTrackData;
  }
}
