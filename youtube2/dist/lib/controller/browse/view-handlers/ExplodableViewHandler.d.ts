import Endpoint from '../../../types/Endpoint';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
export interface QueueItem {
    service: 'youtube2';
    uri: string;
    albumart?: string;
    artist?: string;
    album?: string;
    name: string;
    title: string;
    duration?: number;
    samplerate?: string;
}
export interface ExplodedTrackInfo {
    title: string;
    artist: string;
    albumart: string;
    endpoint: Endpoint;
}
export default abstract class ExplodableViewHandler<V extends View> extends BaseViewHandler<V> {
    explode(): Promise<QueueItem[]>;
    protected abstract getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=ExplodableViewHandler.d.ts.map