import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import { Channel, EndpointLink, Album, Playlist, MusicItem } from '../../../types/ContentItem';
import { BrowseContinuationEndpoint, BrowseEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { Option } from '../../../types/PageElement';
import MusicFolderViewHandler, { MusicFolderView } from './MusicFolderViewHandler';
import { RenderedPage } from './ViewHandler';
import { RenderedListItem } from './renderers/BaseRenderer';
import { ContinuationBundleOption } from './renderers/OptionRenderer';
export interface AlbumView extends MusicFolderView {
    name: 'album';
}
export default class AlbumViewHandler extends MusicFolderViewHandler<AlbumView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null>;
    protected renderToListItem(data: Playlist | MusicItem | Channel | EndpointLink | Album | Option | ContinuationBundleOption, contents: PageContent): RenderedListItem | null;
}
//# sourceMappingURL=AlbumViewHandler.d.ts.map