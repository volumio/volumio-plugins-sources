import { ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    /**
     *  Uri follows a hierarchical view structure, starting with 'mixcloud'.
     * - If nothing follows 'mixcloud', the view would be 'root'.
     *
     * After 'mixcloud/', the uri consists of segments representing the following views:
     * - discover[@slug=...][@orderBy=...][@country=...]
     * - featured[@slug=...][@orderBy=...]
     * - user[@username=...]
     * - cloudcasts[@username=...[@orderBy=...]][@playlistId=...]
     * - cloudcast[@cloudcastId=...][@showMoreFromUser=1]
     * ...
     */
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - cloudcast[@cloudcastId=...][@owner=...]
     * - liveStream[@username=...]
     */
    explodeUri(uri: string): Promise<ExplodedTrackInfo[]>;
}
//# sourceMappingURL=index.d.ts.map