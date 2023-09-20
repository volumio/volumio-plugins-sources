import TrackEntity from '../entities/TrackEntity';
export default class TrackHelper {
    static cacheTracks(tracks: TrackEntity[], cacheKeyGen: (keyData: Record<string, any>) => string): void;
    static getPreferredTranscoding(track: TrackEntity): string | null | undefined;
}
//# sourceMappingURL=TrackHelper.d.ts.map