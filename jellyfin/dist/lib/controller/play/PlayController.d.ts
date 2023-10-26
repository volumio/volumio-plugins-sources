import ConnectionManager from '../../connection/ConnectionManager';
import ServerConnection from '../../connection/ServerConnection';
import { Song } from '../../entities';
import { ExplodedTrackInfo } from '../browse/view-handlers/Explodable';
export default class PlayController {
    #private;
    constructor(connectionManager: ConnectionManager);
    /**
     * Track uri:
     * jellyfin/{username}@{serverId}/song@songId={songId}
     */
    clearAddPlayTrack(track: ExplodedTrackInfo): Promise<void>;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    dispose(): void;
    prefetch(track: ExplodedTrackInfo): Promise<any>;
    getSongFromTrack(track: ExplodedTrackInfo): Promise<{
        song: Song;
        connection: ServerConnection;
    }>;
}
//# sourceMappingURL=PlayController.d.ts.map