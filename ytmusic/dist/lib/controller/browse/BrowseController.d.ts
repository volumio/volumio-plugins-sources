import { QueueItem } from './view-handlers/ExplodableViewHandler';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - video[@explodeTrackData=...]
     * - song[@explodeTrackData=...]
     * - playlist[@endpoints=...]
     * - generic[@endpoint=...]
     *
     * Legacy (pre v1.0) uris:
     * - song[@explodeTrackData=...]
     * - video[@explodeTrackData=...]
     * - album[@albumId=...]
     * - artist[@artistId=...]
     * - playlist[@playlistId=...]
     * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
     *
     * Legacy uris will be converted to current format
     */
    explodeUri(uri: string): Promise<QueueItem[]>;
}
//# sourceMappingURL=BrowseController.d.ts.map