import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';
export interface MusicItemView extends View {
    name: 'video' | 'song';
    explodeTrackData: ExplodedTrackInfo;
}
export default class MusicItemViewHandler extends ExplodableViewHandler<MusicItemView> {
    protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=MusicItemViewHandler.d.ts.map