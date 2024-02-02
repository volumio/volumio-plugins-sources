import { QueueItem } from './view-handlers/ExplodableViewHandler';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - track[@trackId=...]
     * - playlists[@playlistId=...]
     * - albums[@albumId=...]
     * - users[@userId=...]
     */
    explodeUri(uri: string): Promise<QueueItem[]>;
}
//# sourceMappingURL=BrowseController.d.ts.map