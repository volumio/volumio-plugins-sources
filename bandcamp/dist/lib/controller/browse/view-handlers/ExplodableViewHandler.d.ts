import BaseViewHandler from './BaseViewHandler';
import View from './View';
import TrackEntity from '../../../entities/TrackEntity';
export interface ExplodedTrackInfo {
    service: 'bandcamp';
    uri: string;
    albumart?: string;
    artist?: string;
    album?: string;
    name: string;
    title: string;
    duration?: number;
    samplerate?: string;
}
export default abstract class ExplodableViewHandler<V extends View, E extends TrackEntity = TrackEntity> extends BaseViewHandler<V> {
    explode(): Promise<ExplodedTrackInfo[]>;
    protected parseTrackForExplode(track: E): Promise<ExplodedTrackInfo | null>;
    protected abstract getTracksOnExplode(): Promise<E | E[]>;
    /**
     * Track uri:
     * bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
     */
    protected getTrackUri(track: E): string | null;
}
//# sourceMappingURL=ExplodableViewHandler.d.ts.map