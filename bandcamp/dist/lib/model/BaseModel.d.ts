export interface LoopFetchParams<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>> extends LoopFetchCallbackParams {
    callbackParams?: C;
    getFetchPromise: (params: C) => Promise<R>;
    getItemsFromFetchResult: (fetchResult: R, params: C) => I[];
    filterFetchedItem?: (item: I, params: C) => boolean;
    getNextPageTokenFromFetchResult?: (fetchResult: R, params: C) => string | null;
    convertToEntity: (item: I, params: C) => E | null;
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
export default class BaseModel {
    #private;
    loopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(params: LoopFetchParams<R, I, C, E, F>): Promise<F>;
    protected getCacheKeyForFetch(resourceName: string, cacheKeyParams?: Record<string, any>): string;
    protected getAlbumImageFormat(): string;
    protected getArtistImageFormat(): string;
}
//# sourceMappingURL=BaseModel.d.ts.map