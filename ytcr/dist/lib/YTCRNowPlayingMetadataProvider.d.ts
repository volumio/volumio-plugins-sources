import { type MetadataAlbumInfo, type MetadataArtistInfo, type MetadataSongInfo, type NowPlayingMetadataProvider } from 'now-playing-common';
import type MPDPlayer from './MPDPlayer';
import { type Logger } from 'yt-cast-receiver';
export default class YTCRNowPlayingMetadataProvider implements NowPlayingMetadataProvider {
    #private;
    version: '1.0.0';
    constructor(player: MPDPlayer, logger: Logger);
    getSongInfo(songTitle: string, albumTitle?: string, artistName?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(): Promise<MetadataArtistInfo | null>;
}
//# sourceMappingURL=YTCRNowPlayingMetadataProvider.d.ts.map