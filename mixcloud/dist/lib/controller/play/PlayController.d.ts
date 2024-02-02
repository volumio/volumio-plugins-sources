import { ExplodedTrackInfo } from '../browse/view-handlers/ExplodableViewHandler';
export default class PlayController {
    #private;
    constructor();
    /**
     * Track uri:
     * - mixcloud/cloudcast@cloudcastId={...}@owner={...}
     * - mixcloud/livestream@username={...}
     */
    clearAddPlayTrack(track: ExplodedTrackInfo): Promise<any>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
}
//# sourceMappingURL=PlayController.d.ts.map