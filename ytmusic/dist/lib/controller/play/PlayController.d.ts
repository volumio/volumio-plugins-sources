import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
export default class PlayController {
    #private;
    constructor();
    reset(): void;
    /**
     * Track uri:
     * - ytmusic/[song|video]@@explodeTrackData={...}
     *
     */
    clearAddPlayTrack(track: QueueItem): Promise<void>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    prefetch(track: QueueItem): Promise<any>;
    getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null>;
}
//# sourceMappingURL=PlayController.d.ts.map