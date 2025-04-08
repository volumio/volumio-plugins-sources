import { ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import { RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - track[@trackUrl=...]
     * - album[@albumUrl=...]
     * - shows[@showUrl=...]
     */
    explodeUri(uri: string): Promise<ExplodedTrackInfo[]>;
}
//# sourceMappingURL=index.d.ts.map