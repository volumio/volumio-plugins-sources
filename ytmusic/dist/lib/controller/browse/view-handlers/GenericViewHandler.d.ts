import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import FeedViewHandler, { FeedView } from './FeedViewHandler';
export type GenericViewBase = FeedView;
export interface GenericView extends GenericViewBase {
    name: 'generic';
}
/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */
export default class GenericViewHandler<V extends GenericViewBase = GenericView> extends FeedViewHandler<V> {
    browse(): Promise<import("./ViewHandler").RenderedPage>;
    protected getContents(): Promise<PageContent>;
    protected assertEndpointExists<T extends Endpoint>(endpoint?: T | null): T;
    protected assertPageContents(content: PageContent | WatchContent | WatchContinuationContent | null): PageContent;
    protected getTracksOnExplode(): Promise<import("./ExplodableViewHandler").ExplodedTrackInfo[]>;
    protected getEndpoint(explode: true): BrowseEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getEndpoint(explode?: boolean): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
}
//# sourceMappingURL=GenericViewHandler.d.ts.map