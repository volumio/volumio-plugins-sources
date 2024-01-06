import TrackEntity from '../../../entities/TrackEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface ShowView extends View {
    name: 'show';
    showUrl: string;
    view?: 'albums' | 'tracks';
}
interface ShowExplodeTrack extends TrackEntity {
    showUrl: string;
}
export default class ShowViewHandler extends ExplodableViewHandler<ShowView> {
    #private;
    browse(): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<ShowExplodeTrack | ShowExplodeTrack[]>;
    /**
     * Override
     *
     * Track uri:
     * bandcamp/show@showUrl={showUrl}
     */
    getTrackUri(track: ShowExplodeTrack): string;
}
export {};
//# sourceMappingURL=ShowViewHandler.d.ts.map