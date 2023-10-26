import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface TrackView extends View {
    name: 'track';
    trackUrl: string;
    artistUrl?: string;
    albumUrl?: string;
}
export default class TrackViewHandler extends ExplodableViewHandler<TrackView> {
    #private;
    browse(): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<import("../../../entities/TrackEntity").default>;
}
//# sourceMappingURL=TrackViewHandler.d.ts.map