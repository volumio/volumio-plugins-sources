import ConnectionManager from '../connection/ConnectionManager';
import ServerConnection from '../connection/ServerConnection';
import { Song } from '../entities';
export interface SetSongFavoriteResult {
    songId: string;
    canonicalUri: string | null;
    favorite: boolean;
}
export default class SongHelper {
    static setFavoriteByUri(uri: string, favorite: boolean, connectionManager: ConnectionManager): Promise<SetSongFavoriteResult>;
    static getCanonicalUri(songTarget: Song | string, connection: ServerConnection | null): string | null;
}
//# sourceMappingURL=SongHelper.d.ts.map