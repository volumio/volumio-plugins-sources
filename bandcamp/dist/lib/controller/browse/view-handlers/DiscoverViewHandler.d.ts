import type View from './View';
import { type RenderedPage } from './ViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
import type TrackEntity from '../../../entities/TrackEntity';
export interface DiscoverView extends View {
    name: 'discover';
    select?: 'genre' | 'subgenre' | 'sortBy' | 'location' | 'category' | 'time' | 'relatedTag';
    genre?: string;
    subgenre?: string;
    sortBy?: string;
    location?: string;
    category?: string;
    time?: string;
    customTags?: string;
}
export default class DiscoverViewHandler extends ExplodableViewHandler<DiscoverView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected getTracksOnExplode(): Promise<TrackEntity[]>;
    /**
     * Override
     *
     * Add track uri:
     * - bandcamp/album@albumUrl={...}@trackId={...}@artistUrl={...}
     */
    getTrackUri(track: TrackEntity): string | null;
}
//# sourceMappingURL=DiscoverViewHandler.d.ts.map