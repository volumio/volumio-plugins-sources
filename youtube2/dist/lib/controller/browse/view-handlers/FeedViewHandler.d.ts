import { ContentItem, PageElement } from '../../../types';
import Endpoint from '../../../types/Endpoint';
import PageContent from '../../../types/PageContent';
import ExplodableViewHandler from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RenderedHeader } from './renderers/BaseRenderer';
import { ContinuationBundleOption } from './renderers/OptionRenderer';
import { SectionItem } from '../../../types/PageElement';
/**
 * View handler for feed contents consisting of sections and optional header.
 */
export interface FeedView extends View {
    endpoint?: Endpoint;
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
    protected findAllEndpointsInSection(target?: PageElement.Section | PageElement.Section[], predicate?: (endpoint: Endpoint) => boolean): Endpoint[];
}
export {};
//# sourceMappingURL=FeedViewHandler.d.ts.map