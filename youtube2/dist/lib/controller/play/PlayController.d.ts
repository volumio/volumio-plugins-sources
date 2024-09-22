import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
import VideoPlaybackInfo from '../../types/VideoPlaybackInfo';
export default class PlayController {
    #private;
    constructor();
    reset(): void;
    /**
     * Track uri:
     * - youtube2/video@endpoint={...}@explodeTrackData={...}
     *
     */
    clearAddPlayTrack(track: QueueItem): Promise<void>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    static getPlaybackInfoFromUri(uri: string): Promise<{
        videoId: string;
        info: VideoPlaybackInfo | null;
    }>;
    getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null>;
    prefetch(track: QueueItem): Promise<any>;
}
//# sourceMappingURL=PlayController.d.ts.map