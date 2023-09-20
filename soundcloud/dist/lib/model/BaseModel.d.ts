import SoundCloud, { Collection, EntityType } from 'soundcloud-fetch';
export interface LoopFetchParams<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>> extends LoopFetchCallbackParams {
    callbackParams?: C;
    getFetchPromise: (params: C) => Promise<R>;
    getItemsFromFetchResult: (fetchResult: R, params: C) => I[];
    filterFetchedItem?: (item: I, params: C) => boolean;
    getNextPageTokenFromFetchResult?: (fetchResult: R, params: C) => string | null;
    convertToEntity: (item: I, params: C) => Promise<E | null>;
    onEnd?: (result: LoopFetchResult<E>, lastFetchResult: R, params: C) => F;
    maxIterations?: number;
    pageOffset?: number;
    limit?: number;
}
export interface LoopFetchCallbackParams {
    pageToken?: string;
}
export interface LoopFetchResult<E> {
    items: E[];
    nextPageToken: string | null;
    nextPageOffset: number;
}
export default abstract class BaseModel {
    #private;
    static queryMaxLimit: number;
    protected getSoundCloudAPI(): SoundCloud;
    static setAccessToken(value: string): void;
    hasAccessToken(): boolean;
    static setLocale(value: string): void;
    loopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(params: LoopFetchParams<R, I, C, E, F>): Promise<F>;
    protected getCacheKeyForFetch(resourceName: string, cacheKeyParams: Record<string, any>): string;
    protected commonGetCollectionItemsFromLoopFetchResult<T extends EntityType>(result: Collection<T>): T[];
    protected commonGetNextPageTokenFromLoopFetchResult<T extends EntityType>(result: Collection<T>): string | null;
    protected commonGetLoopFetchResultByPageToken<T extends EntityType>(params: LoopFetchCallbackParams): Promise<Collection<T> | null>;
}
//# sourceMappingURL=BaseModel.d.ts.map