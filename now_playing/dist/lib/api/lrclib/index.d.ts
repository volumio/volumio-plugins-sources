import { MetadataLyrics } from 'now-playing-common';
export interface LRCLibAPIGetParams {
    songTitle: string;
    artistName: string;
    albumTitle: string;
    duration: number;
}
export default class LRCLibAPI {
    static getLyrics(songTitle: string, albumTitle?: string, artistName?: string, duration?: number): Promise<MetadataLyrics | null>;
}
//# sourceMappingURL=index.d.ts.map