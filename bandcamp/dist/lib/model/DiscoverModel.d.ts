import { DiscoverParams } from 'bandcamp-fetch';
import BaseModel, { LoopFetchResult } from './BaseModel';
import AlbumEntity from '../entities/AlbumEntity';
export interface DiscoveryModelGetDiscoverResultParams {
    discoverParams: DiscoverParams;
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export interface DiscoverLoopFetchResult extends LoopFetchResult<AlbumEntity> {
    params: DiscoverParams;
}
export default class DiscoverModel extends BaseModel {
    #private;
    getDiscoverResult(params: DiscoveryModelGetDiscoverResultParams): Promise<DiscoverLoopFetchResult>;
    getDiscoverOptions(): Promise<import("bandcamp-fetch").DiscoverOptions>;
}
//# sourceMappingURL=DiscoverModel.d.ts.map