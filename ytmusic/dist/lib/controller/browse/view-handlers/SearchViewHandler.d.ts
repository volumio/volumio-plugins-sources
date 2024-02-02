import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { PageContent } from '../../../types/Content';
import GenericViewHandler, { GenericViewBase } from './GenericViewHandler';
export interface SearchView extends GenericViewBase {
    name: 'search';
    query: string;
}
export default class SearchViewHandler extends GenericViewHandler<SearchView> {
    #private;
    protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode?: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getContents(): Promise<PageContent>;
}
//# sourceMappingURL=SearchViewHandler.d.ts.map