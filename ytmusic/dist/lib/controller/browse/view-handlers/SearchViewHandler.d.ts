import { type BrowseContinuationEndpoint, type BrowseEndpoint, type SearchContinuationEndpoint, type SearchEndpoint, type WatchContinuationEndpoint, type WatchEndpoint } from '../../../types/Endpoint';
import { type PageContent } from '../../../types/Content';
import GenericViewHandler, { type GenericViewBase } from './GenericViewHandler';
export interface SearchView extends GenericViewBase {
    name: 'search';
    query: string;
}
export default class SearchViewHandler extends GenericViewHandler<SearchView> {
    #private;
    protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode?: false): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getContents(): Promise<PageContent>;
}
//# sourceMappingURL=SearchViewHandler.d.ts.map