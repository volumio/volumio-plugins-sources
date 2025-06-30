import { PlaylistAPI, SearchAPI, SearchAPIGetShowsParams, UserAPI, UserAPIGetShowsParams } from 'mixcloud-fetch';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import { CloudcastEntity } from '../entities/CloudcastEntity';
export type GetCloudcastsType = 'byUser' | 'byPlaylist' | 'bySearch';
export type CloudcastOrderby = NonNullable<UserAPIGetShowsParams['orderBy']>;
export type CloudcastDateUploaded = NonNullable<SearchAPIGetShowsParams['dateUploaded']>;
export interface CloudcastSearchOptionValues {
    dateUploaded: CloudcastDateUploaded;
}
export type CloudcastModelGetCloudcastsParams = CommonModelPaginationParams & ({
    username: string;
    orderBy?: CloudcastOrderby;
    playlistId?: undefined;
    keywords?: undefined;
    dateUploaded?: undefined;
} | {
    playlistId: string;
    username?: undefined;
    keywords?: undefined;
    orderBy?: undefined;
    dateUploaded?: undefined;
} | {
    keywords: string;
    dateUploaded?: CloudcastDateUploaded;
    username?: undefined;
    playlistId?: undefined;
    orderBy?: undefined;
});
export type GetCloudcastsFetchResult<T extends GetCloudcastsType> = T extends 'byUser' ? NonNullable<Awaited<ReturnType<UserAPI['getShows']>>> : T extends 'byPlaylist' ? NonNullable<Awaited<ReturnType<PlaylistAPI['getShows']>>> : T extends 'bySearch' ? NonNullable<Awaited<ReturnType<SearchAPI['getShows']>>> : never;
export interface GetCloudcastsLoopFetchResult<T extends GetCloudcastsType> extends LoopFetchResult<CloudcastEntity> {
    params: GetCloudcastsFetchResult<T>['params'];
}
export default class CloudcastModel extends BaseModel {
    #private;
    getCloudcasts(params: CloudcastModelGetCloudcastsParams & {
        username: string;
    }): Promise<GetCloudcastsLoopFetchResult<'byUser'>>;
    getCloudcasts(params: CloudcastModelGetCloudcastsParams & {
        playlistId: string;
    }): Promise<GetCloudcastsLoopFetchResult<'byPlaylist'>>;
    getCloudcasts(params: CloudcastModelGetCloudcastsParams & {
        keywords: string;
    }): Promise<GetCloudcastsLoopFetchResult<'bySearch'>>;
    getCloudcast(cloudcastId: string): Promise<CloudcastEntity | null>;
    getSearchOptions(): OptionBundle<CloudcastSearchOptionValues>;
}
//# sourceMappingURL=CloudcastModel.d.ts.map