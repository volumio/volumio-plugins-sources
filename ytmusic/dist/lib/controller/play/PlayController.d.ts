import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
import MusicItemPlaybackInfo from '../../types/MusicItemPlaybackInfo';
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
    static getPlaybackInfoFromUri(uri: QueueItem['uri']): Promise<{
        videoId: string;
        info: MusicItemPlaybackInfo | null;
    }>;
    prefetch(track: QueueItem): Promise<any>;
    getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null>;
}
//# sourceMappingURL=PlayController.d.ts.map