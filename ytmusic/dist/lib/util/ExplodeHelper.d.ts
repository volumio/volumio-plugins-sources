import { ExplodedTrackInfo, QueueItem } from '../controller/browse/view-handlers/ExplodableViewHandler';
import { ContentItem } from '../types';
export default class ExplodeHelper {
    #private;
    static getExplodedTrackInfoFromMusicItem(data: ContentItem.MusicItem): ExplodedTrackInfo;
    static getExplodedTrackInfoFromUri(uri?: string | null): ExplodedTrackInfo | null;
    static validateExplodeUri(uri: string): any;
    /**
     * Converts a legacy URI (pre-v1.0) to one that current version can explode.
     * Legacy URI:
     * - song[@explodeTrackData=...]
     * - video[@explodeTrackData=...]
     * - album[@albumId=...]
     * - artist[@artistId=...]
     * - playlist[@playlistId=...]
     * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
     * @param {*} uri
     * @returns Converted URI or `null` on failure
     */
    static convertLegacyExplodeUri(uri: string): Promise<string | null>;
    static createQueueItemFromExplodedTrackInfo(info: ExplodedTrackInfo): QueueItem;
}
//# sourceMappingURL=ExplodeHelper.d.ts.map