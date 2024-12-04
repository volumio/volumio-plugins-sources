import { type PageContent, type WatchContent, type WatchContinuationContent } from '../../../types/Content';
import { type BrowseContinuationEndpoint, type BrowseEndpoint, type SearchContinuationEndpoint, type SearchEndpoint, type WatchContinuationEndpoint, type WatchEndpoint } from '../../../types/Endpoint';
import MusicFolderViewHandler, { type MusicFolderView } from './MusicFolderViewHandler';
export interface PlaylistView extends MusicFolderView {
    name: 'playlist';
}
export default class PlaylistViewHandler extends MusicFolderViewHandler<PlaylistView> {
    protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null>;
    protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
    protected getEndpoint(explode: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    protected getEndpoint(explode?: boolean): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
}
//# sourceMappingURL=PlaylistViewHandler.d.ts.map