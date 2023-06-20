import ConnectionManager from '../../connection/ConnectionManager';
import { ExplodedTrackInfo } from './view-handlers/Explodable';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    constructor(connectionManager: ConnectionManager);
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - song[@songId=...]
     * - songs[@albumId=...] | [ [@playlistId=...| @parentId=...] ]
     * - albums[@parentId=...][@genreId=...| @artistId=...| @albumArtistId=...]
     *
     */
    explodeUri(uri: string): Promise<ExplodedTrackInfo[]>;
}
//# sourceMappingURL=index.d.ts.map