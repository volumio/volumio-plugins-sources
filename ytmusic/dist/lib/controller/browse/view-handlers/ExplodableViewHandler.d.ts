import AutoplayContext from '../../../types/AutoplayContext';
import { WatchEndpoint } from '../../../types/Endpoint';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
export interface QueueItem {
    service: 'ytmusic';
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
    type: 'video' | 'song';
    title: string;
    artist: string;
    album: string;
    albumart: string;
    endpoint: WatchEndpoint;
    autoplayContext?: AutoplayContext;
}
export default abstract class ExplodableViewHandler<V extends View> extends BaseViewHandler<V> {
    explode(): Promise<QueueItem[]>;
    protected abstract getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=ExplodableViewHandler.d.ts.map