import { type PageContent, type WatchContent } from '../../../types/Content';
import type Endpoint from '../../../types/Endpoint';
import FeedViewHandler, { type FeedView } from './FeedViewHandler';
export interface GenericView extends FeedView {
    name: 'generic';
}
/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */
export default class GenericViewHandler<V extends Omit<GenericView, 'name'> & {
    name: string;
} = GenericView> extends FeedViewHandler<V> {
    browse(): Promise<import("./ViewHandler").RenderedPage>;
    protected getContents(): Promise<PageContent>;
    protected assertEndpointExists(endpoint?: Endpoint | null): Endpoint;
    protected assertPageContents(content: PageContent | WatchContent | null): PageContent;
    protected getTracksOnExplode(): Promise<import("./ExplodableViewHandler").ExplodedTrackInfo[]>;
    protected getEndpoint(_explode?: boolean): Endpoint | null;
}
//# sourceMappingURL=GenericViewHandler.d.ts.map