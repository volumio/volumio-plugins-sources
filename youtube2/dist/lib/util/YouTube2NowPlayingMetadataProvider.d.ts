import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
export default class YouTube2NowPlayingMetadataProvider implements NowPlayingMetadataProvider {
    version: '1.0.0';
    constructor();
    getSongInfo(songTitle: string, _albumTitle?: string, artistName?: string, uri?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(artistName?: string, payload?: string | {
        channelId: string;
    }): Promise<MetadataArtistInfo | null>;
}
//# sourceMappingURL=YouTube2NowPlayingMetadataProvider.d.ts.map