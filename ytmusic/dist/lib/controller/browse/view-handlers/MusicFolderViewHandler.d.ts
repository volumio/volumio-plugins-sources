import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import GenericViewHandler, { GenericViewBase } from './GenericViewHandler';
export interface MusicFolderView extends GenericViewBase {
    name: string;
    endpoints: {
        browse: BrowseEndpoint;
        watch: WatchEndpoint;
    };
}
export default abstract class MusicFolderViewHandler<T extends MusicFolderView> extends GenericViewHandler<T> {
    protected getContents(): Promise<PageContent>;
    protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getEndpoint(explode?: boolean | undefined): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected abstract modelGetContents(endpoint: BrowseEndpoint | BrowseContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint): Promise<WatchContent | WatchContinuationContent | PageContent | null>;
}
//# sourceMappingURL=MusicFolderViewHandler.d.ts.map