import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
import MPDPlayer from './MPDPlayer';
import { Logger } from 'yt-cast-receiver';
export default class YTCRNowPlayingMetadataProvider implements NowPlayingMetadataProvider {
    #private;
    version: '1.0.0';
    constructor(player: MPDPlayer, logger: Logger);
    getSongInfo(songTitle: string, albumTitle?: string, artistName?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(): Promise<MetadataArtistInfo | null>;
}
//# sourceMappingURL=YTCRNowPlayingMetadataProvider.d.ts.map