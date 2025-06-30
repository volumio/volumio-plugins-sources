import { type PageContent, type WatchContent, type WatchContinuationContent } from '../../../types/Content';
import { type Channel, type EndpointLink, type Album, type Playlist, type MusicItem } from '../../../types/ContentItem';
import { type BrowseContinuationEndpoint, type BrowseEndpoint, type WatchContinuationEndpoint, type WatchEndpoint } from '../../../types/Endpoint';
import { type Option } from '../../../types/PageElement';
import MusicFolderViewHandler, { type MusicFolderView } from './MusicFolderViewHandler';
import { type RenderedPage } from './ViewHandler';
import { type RenderedListItem } from './renderers/BaseRenderer';
import { type ContinuationBundleOption } from './renderers/OptionRenderer';
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