import BaseModel, { LoopFetchResult } from './BaseModel';
import BandEntity from '../entities/BandEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
import TagEntity from '../entities/TagEntity';
export interface FanModelGetFanItemsParams {
    username: string;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class FanModel extends BaseModel {
    #private;
    getInfo(username?: string): Promise<import("bandcamp-fetch/dist/mjs/lib/types/Fan").default>;
    getCollection(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TrackEntity | AlbumEntity>>;
    getWishlist(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TrackEntity | AlbumEntity>>;
    getFollowingArtistsAndLabels(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<BandEntity>>;
    getFollowingGenres(params: FanModelGetFanItemsParams): Promise<LoopFetchResult<TagEntity>>;
}
//# sourceMappingURL=FanModel.d.ts.map