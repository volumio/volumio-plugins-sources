import View from './View';
import { RenderedPage } from './ViewHandler';
import TrackEntity from '../../../entities/TrackEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
export interface TagView extends View {
    name: 'tag';
    tagUrl: string;
    select?: string;
}
export default class TagViewHandler extends ExplodableViewHandler<TagView> {
    #private;
    browse(): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<TrackEntity[]>;
    /**
     * Override
     *
     * Track uri - one of:
     * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}
     * - bandcamp/track@trackUrl={...}@artistUrl={...}@albumurl={...}
     */
    getTrackUri(track: TrackEntity): string | null;
}
//# sourceMappingURL=TagViewHandler.d.ts.map