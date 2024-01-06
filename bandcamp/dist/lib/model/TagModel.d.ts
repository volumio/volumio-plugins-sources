import { ReleasesByTag, TagAPIGetReleasesParams } from 'bandcamp-fetch';
import BaseModel, { LoopFetchResult } from './BaseModel';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
export interface TagModelGetReleasesParams {
    tagUrl: string;
    filters: TagAPIGetReleasesParams['filters'];
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export interface ReleasesLoopFetchResult extends LoopFetchResult<AlbumEntity | TrackEntity> {
    filters: ReleasesByTag['filters'];
}
export default class TagModel extends BaseModel {
    #private;
    getReleases(params: TagModelGetReleasesParams): Promise<ReleasesLoopFetchResult>;
    getTag(tagUrl: string): Promise<import("../entities/TagEntity").default>;
    getTags(): Promise<{
        tags: import("../entities/TagEntity").default[];
        locations: import("../entities/TagEntity").default[];
    }>;
    getReleasesAvailableFilters(tagUrl: string): Promise<ReleasesByTag.Filter[]>;
}
//# sourceMappingURL=TagModel.d.ts.map