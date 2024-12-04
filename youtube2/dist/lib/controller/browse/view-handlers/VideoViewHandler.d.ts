import ExplodableViewHandler, { type ExplodedTrackInfo } from './ExplodableViewHandler';
import type View from './View';
export interface VideoView extends View {
    name: 'video';
    explodeTrackData: ExplodedTrackInfo;
}
export default class VideoViewHandler extends ExplodableViewHandler<VideoView> {
    protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=VideoViewHandler.d.ts.map