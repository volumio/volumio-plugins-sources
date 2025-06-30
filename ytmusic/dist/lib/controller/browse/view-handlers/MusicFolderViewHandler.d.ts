import { type BrowseContinuationEndpoint, type BrowseEndpoint, type SearchContinuationEndpoint, type SearchEndpoint, type WatchContinuationEndpoint, type WatchEndpoint } from '../../../types/Endpoint';
import { type PageContent, type WatchContent, type WatchContinuationContent } from '../../../types/Content';
import GenericViewHandler, { type GenericViewBase } from './GenericViewHandler';
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
    protected getEndpoint(explode?: boolean): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected abstract modelGetContents(endpoint: BrowseEndpoint | BrowseContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint): Promise<WatchContent | WatchContinuationContent | PageContent | null>;
}
//# sourceMappingURL=MusicFolderViewHandler.d.ts.map