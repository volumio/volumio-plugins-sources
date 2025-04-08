import TrackEntity from '../../../entities/TrackEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface BandView extends View {
    name: 'band';
    bandUrl: string;
    view?: 'discography' | 'artists';
}
export default class BandViewHandler extends ExplodableViewHandler<BandView> {
    #private;
    browse(): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<TrackEntity | TrackEntity[]>;
}
//# sourceMappingURL=BandViewHandler.d.ts.map