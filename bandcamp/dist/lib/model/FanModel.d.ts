import BaseModel, { type LoopFetchResult } from './BaseModel';
import type BandEntity from '../entities/BandEntity';
import type AlbumEntity from '../entities/AlbumEntity';
import type TrackEntity from '../entities/TrackEntity';
import type TagEntity from '../entities/TagEntity';
export interface FanModelGetFanItemsParams {
    username: string;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class FanModel extends BaseModel {
    #private;
    getInfo(username?: string): Promise<import("bandcamp-fetch").Fan>;
    getCollection(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TrackEntity | AlbumEntity>>;
    getWishlist(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TrackEntity | AlbumEntity>>;
    getFollowingArtistsAndLabels(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<BandEntity>>;
    getFollowingGenres(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TagEntity>>;
}
//# sourceMappingURL=FanModel.d.ts.map