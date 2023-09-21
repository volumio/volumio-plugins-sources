import { QueueItem } from './view-handlers/ExplodableViewHandler';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - video[@explodeTrackData=...]
     * - playlist[@endpoint=...]
     * - generic[@endpoint=...]
     *
     * Legacy (pre v1.0) uris:
     * - video[@videoId=...][@fromPlaylistId=...]
     * - videos[@playlistId=...]
     * - playlists[@channelId=...]
     *
     * Legacy uris will be converted to current format
     */
    explodeUri(uri: string): Promise<QueueItem[]>;
}
//# sourceMappingURL=index.d.ts.map