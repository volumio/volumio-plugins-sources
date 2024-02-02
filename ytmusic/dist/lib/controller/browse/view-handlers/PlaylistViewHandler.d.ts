import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import MusicFolderViewHandler, { MusicFolderView } from './MusicFolderViewHandler';
export interface PlaylistView extends MusicFolderView {
    name: 'playlist';
}
export default class PlaylistViewHandler extends MusicFolderViewHandler<PlaylistView> {
    protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null>;
    protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getEndpoint(explode?: boolean | undefined): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
}
//# sourceMappingURL=PlaylistViewHandler.d.ts.map