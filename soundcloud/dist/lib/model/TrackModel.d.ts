import BaseModel, { LoopFetchResult } from './BaseModel';
import TrackEntity from '../entities/TrackEntity';
export interface TrackModelGetTracksParams {
    search?: string;
    userId?: number;
    topFeatured?: boolean;
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
}
export default class TrackModel extends BaseModel {
    #private;
    getTracks(params: TrackModelGetTracksParams): Promise<LoopFetchResult<TrackEntity>>;
    getTrack(trackId: number): Promise<TrackEntity | null>;
    getStreamingUrl(transcodingUrl: string): Promise<string | null>;
}
//# sourceMappingURL=TrackModel.d.ts.map