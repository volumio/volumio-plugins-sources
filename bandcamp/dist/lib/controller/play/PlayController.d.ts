import { ExplodedTrackInfo } from '../browse/view-handlers/ExplodableViewHandler';
export default class PlayController {
    #private;
    constructor();
    /**
     * Track uri:
     * - bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
     * - bandcamp/show@showUrl={showUrl}
     * - bandcamp/article@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
     * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}@albumUrl={...}
     */
    clearAddPlayTrack(track: ExplodedTrackInfo): Promise<any>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    dispose(): void;
    prefetch(track: ExplodedTrackInfo): Promise<any>;
}
//# sourceMappingURL=PlayController.d.ts.map