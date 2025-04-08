import { Api } from '@jellyfin/sdk';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import Parser from './parser/Parser';
import { BaseItemDto, ItemFields, ItemFilter, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import ServerConnection from '../connection/ServerConnection';
import { EntityType } from '../entities';
export interface GetItemsResult<T> {
    items: T[];
    startIndex: number;
    total: number;
    omitted: number;
    nextStartIndex?: number;
}
export interface GetFiltersResult {
    years: number[] | null;
}
export type GetItemType = EntityType.Playlist | EntityType.Album | EntityType.Artist | EntityType.Genre | EntityType.Song;
export interface GetItemsParams {
    parentId?: string;
    startIndex?: number;
    limit?: number;
    sortBy?: ItemSortBy[] | ItemSortBy | null;
    sortOrder?: SortOrder[] | SortOrder | null;
    recursive?: boolean;
    filters?: ItemFilter[] | string;
    nameStartsWith?: string;
    itemTypes?: GetItemType[] | string;
    excludeItemTypes?: GetItemType[] | string;
    excludeItemIds?: string[] | string;
    fields?: ItemFields[] | string;
    genreIds?: string[] | string;
    artistIds?: string[] | string;
    albumArtistIds?: string[] | string;
    contributingArtistIds?: string[] | string;
    years?: number[] | string;
    search?: string;
}
export interface GetItemParams {
    itemId: string;
}
export interface GetFiltersParams {
    parentId: string;
    itemTypes?: (EntityType.Album | EntityType.Song)[];
}
type GetApiMethod<A> = {
    getApi: (api: Api) => A;
    getItems: keyof A;
};
export default class BaseModel {
    #private;
    constructor(connection: ServerConnection);
    getItemsFromAPI<T, A = unknown>(params: GetItemsParams, parser: Parser<T>, getApiMethod?: GetApiMethod<A>): Promise<GetItemsResult<T>>;
    protected parseItemDtos<T>(items: BaseItemDto[], parser: Parser<T>, filterNull?: true): Promise<T[]>;
    protected parseItemDtos<T>(items: BaseItemDto[], parser: Parser<T>, filterNull: false): Promise<(T | null)[]>;
    getItemFromApi<T>(params: GetItemParams, parser: Parser<T>): Promise<T | null>;
    getFiltersFromApi(params: GetFiltersParams): Promise<GetFiltersResult>;
    markFavorite(itemId: string): Promise<boolean>;
    unmarkFavorite(itemId: string): Promise<boolean>;
    get connection(): ServerConnection;
}
export {};
//# sourceMappingURL=BaseModel.d.ts.map