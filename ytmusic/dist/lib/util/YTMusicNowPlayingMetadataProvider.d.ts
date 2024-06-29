import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
export default class YTMusicNowPlayingMetadataProvider implements NowPlayingMetadataProvider {
    version: '1.0.0';
    constructor();
    getSongInfo(songTitle: string, albumTitle?: string, artistName?: string, uri?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(albumTitle?: string, artistName?: string, payload?: string | {
        albumId: string;
    }): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(artistName?: string, payload?: string | {
        channelId: string;
    }): Promise<MetadataArtistInfo | null>;
}
//# sourceMappingURL=YTMusicNowPlayingMetadataProvider.d.ts.map