import { type ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import { type RenderedPage } from './view-handlers/ViewHandler';
export default class BrowseController {
    #private;
    browseUri(uri: string): Promise<RenderedPage>;
    /**
     * Explodable uris:
     * - track[@trackUrl=...]
     * - album[@albumUrl=...]
     * - shows[@showUrl=...]
     * - discover[@...]
     */
    explodeUri(uri: string): Promise<ExplodedTrackInfo[]>;
}
//# sourceMappingURL=index.d.ts.map