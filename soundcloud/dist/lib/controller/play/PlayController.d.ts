import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
export default class PlayController {
    #private;
    constructor();
    /**
     * Track uri:
     * soundcloud/track@trackId=...
     */
    clearAddPlayTrack(track: QueueItem): Promise<void>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null>;
}
//# sourceMappingURL=PlayController.d.ts.map