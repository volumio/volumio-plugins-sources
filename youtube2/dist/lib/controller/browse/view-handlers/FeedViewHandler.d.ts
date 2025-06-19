import { type ContentItem, type PageElement } from '../../../types';
import { type BrowseContinuationEndpoint, type BrowseEndpoint, type SearchContinuationEndpoint, type SearchEndpoint, type WatchEndpoint } from '../../../types/Endpoint';
import type Endpoint from '../../../types/Endpoint';
import ExplodableViewHandler from './ExplodableViewHandler';
import { type ContinuationBundle } from './View';
import type View from './View';
import { type RenderedList, type RenderedPage } from './ViewHandler';
import { type RenderedHeader } from './renderers/BaseRenderer';
import { type ContinuationBundleOption } from './renderers/OptionRenderer';
import { type SectionItem } from '../../../types/PageElement';
import { type PageContent } from '../../../types/Content';
/**
 * View handler for feed contents consisting of sections and optional header.
 */
export interface FeedView extends View {
    endpoint?: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint;
}
type RenderableItem = ContentItem.Channel | ContentItem.EndpointLink | ContentItem.GuideEntry | ContentItem.Playlist | ContentItem.Video | PageElement.Option | ContinuationBundleOption;
export default abstract class FeedViewHandler<V extends FeedView = FeedView> extends ExplodableViewHandler<V> {
    #private;
    browse(): Promise<RenderedPage>;
    protected abstract getContents(): Promise<PageContent | null>;
    getHeader(data?: PageElement.Header): RenderedHeader | null;
    createContinuationBundle(contents: PageContent, section: PageElement.Section): ContinuationBundle;
    applyContinuationBundle(contents: PageContent): boolean;
    protected getAvailableListViews(items: RenderableItem[]): RenderedList['availableListViews'];
    protected findAllItemsInSection(target: PageElement.Section | PageElement.Section[], predicate?: (item: SectionItem) => boolean): SectionItem[];
    protected findAllEndpointsInSection<T extends Endpoint>(target?: PageElement.Section | PageElement.Section[], predicate?: (endpoint: Endpoint) => boolean): T[];
}
export {};
//# sourceMappingURL=FeedViewHandler.d.ts.map