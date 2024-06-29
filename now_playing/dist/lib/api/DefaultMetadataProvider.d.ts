import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
export default class DefaultMetadataProvider implements NowPlayingMetadataProvider {
    #private;
    version: '1.0.0';
    constructor();
    config(params: {
        accessToken: string;
    }): void;
    getSongInfo(songTitle: string, albumTitle?: string, artistName?: string): Promise<MetadataSongInfo | null>;
    getAlbumInfo(albumTitle: string, artistName?: string): Promise<MetadataAlbumInfo | null>;
    getArtistInfo(artistName: string): Promise<MetadataArtistInfo | null>;
    clearCache(): void;
}
//# sourceMappingURL=DefaultMetadataProvider.d.ts.map