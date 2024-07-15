import { ExplodedTrackInfo, QueueItem } from '../controller/browse/view-handlers/ExplodableViewHandler';
import { ContentItem } from '../types';
export default class ExplodeHelper {
    #private;
    static getExplodedTrackInfoFromVideo(data: ContentItem.Video): ExplodedTrackInfo;
    static getExplodedTrackInfoFromUri(uri: string): ExplodedTrackInfo | null;
    static validateExplodeUri(uri: string): any;
    /**
     * Converts a legacy URI (pre v1.1) to one that current version can explode.
     * @param {*} uri
     * @returns Converted URI or `null` on failure
     */
    static convertLegacyExplodeUri(uri: string): Promise<string | null>;
    static createQueueItemFromExplodedTrackInfo(info: ExplodedTrackInfo): QueueItem;
}
//# sourceMappingURL=ExplodeHelper.d.ts.map