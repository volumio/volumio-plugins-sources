import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
import ConnectionManager from '../connection/ConnectionManager';
export default class JellyfinNowPlayingMetadataProvider implements NowPlayingMetadataProvider {
    #private;
    version: '1.0.0';
    constructor(connectionManager: ConnectionManager);
    getSongInfo(songTitle: string, _albumTitle?: string, _artistName?: string, uri?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(): Promise<MetadataArtistInfo | null>;
}
//# sourceMappingURL=JellyfinNowPlayingMetadataProvider.d.ts.map