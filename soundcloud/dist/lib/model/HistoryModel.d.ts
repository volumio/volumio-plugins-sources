import BaseModel, { LoopFetchResult } from './BaseModel';
import TrackEntity from '../entities/TrackEntity';
import PlaylistEntity from '../entities/PlaylistEntity';
import AlbumEntity from '../entities/AlbumEntity';
export interface HistoryModelGetPlayHistoryItemsParams {
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
    type: 'set' | 'track';
}
export default class HistoryModel extends BaseModel {
    #private;
    getPlayHistory(params: HistoryModelGetPlayHistoryItemsParams): Promise<LoopFetchResult<TrackEntity | PlaylistEntity | AlbumEntity>>;
}
//# sourceMappingURL=HistoryModel.d.ts.map