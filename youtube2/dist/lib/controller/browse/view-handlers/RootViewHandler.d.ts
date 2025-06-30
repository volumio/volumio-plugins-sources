import { type PageContent } from '../../../types/Content';
import { type ExplodedTrackInfo } from './ExplodableViewHandler';
import FeedViewHandler, { type FeedView } from './FeedViewHandler';
import { type RenderedPage } from './ViewHandler';
export interface RootView extends FeedView {
    name: 'root';
}
export default class RootViewHandler extends FeedViewHandler<RootView> {
    protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
    browse(): Promise<RenderedPage>;
    protected getContents(): Promise<PageContent | null>;
    protected getAvailableListViews(): ('list' | 'grid')[];
}
//# sourceMappingURL=RootViewHandler.d.ts.map