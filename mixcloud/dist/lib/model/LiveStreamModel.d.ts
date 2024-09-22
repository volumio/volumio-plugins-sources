import { LiveStreamAPI, LiveStreamAPIGetCurrentParams } from 'mixcloud-fetch';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import { LiveStreamEntity } from '../entities/LiveStreamEntity';
export type LiveStreamOrderBy = NonNullable<LiveStreamAPIGetCurrentParams['orderBy']>;
export interface LiveStreamOptionValues {
    orderBy: LiveStreamOrderBy;
    category: string;
}
export interface LiveStreamModelGetLiveStreamsParams extends CommonModelPaginationParams {
    orderBy?: LiveStreamOrderBy;
    category?: string;
}
export type GetLiveStreamsFetchResult = Awaited<ReturnType<LiveStreamAPI['getCurrent']>>;
export interface GetLiveStreamsLoopFetchResult extends LoopFetchResult<LiveStreamEntity> {
    params: GetLiveStreamsFetchResult['params'];
}
export default class LiveStreamModel extends BaseModel {
    #private;
    getLiveStreams(params: LiveStreamModelGetLiveStreamsParams): Promise<GetLiveStreamsLoopFetchResult>;
    getLiveStream(username: string): Promise<LiveStreamEntity | null>;
    getCategories(): Promise<string[]>;
    getLiveStreamsOptions(): Promise<OptionBundle<LiveStreamOptionValues>>;
}
//# sourceMappingURL=LiveStreamModel.d.ts.map