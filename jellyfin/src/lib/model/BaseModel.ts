import { Api } from '@jellyfin/sdk';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api/filter-api';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { FilterApiGetQueryFiltersLegacyRequest } from '@jellyfin/sdk/lib/generated-client/api/filter-api';
import { UserLibraryApiGetItemRequest } from '@jellyfin/sdk/lib/generated-client/api/user-library-api';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import Parser from './parser/Parser';
import { BaseItemDto, BaseItemKind, ItemFields, ItemFilter, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import ServerConnection from '../connection/ServerConnection';
import { EntityType } from '../entities';
import { ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/items-api';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export interface GetItemsResult<T> {
  items: T[],
  startIndex: number;
  total: number;
  omitted: number;
  nextStartIndex?: number;
}

export interface GetFiltersResult {
  years: number[] | null;
}

export type GetItemType = EntityType.Playlist | EntityType.Album |
    EntityType.Artist | EntityType.Genre | EntityType.Song;

export interface GetItemsParams {
  parentId?: string;
  startIndex?: number;
  limit?: number; // Negative value: no limit
  sortBy?: ItemSortBy[] | ItemSortBy | null; // `null`: do not set sortBy (use Jellyfin default)
  sortOrder?: SortOrder[] | SortOrder | null; // `null`: do not set sortOrder (use Jellyfin default)
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
  getApi: (api: Api) => A,
  getItems: keyof A
};

export default class BaseModel {

  #connection: ServerConnection;

  constructor(connection: ServerConnection) {
    this.#connection = connection;
  }

  async getItemsFromAPI<T, A = unknown>(params: GetItemsParams, parser: Parser<T>, getApiMethod?: GetApiMethod<A>): Promise<GetItemsResult<T>> {
    const apiParams = this.#toApiGetItemsParams(params);
    let response;
    if (getApiMethod) {
      const itemsApi = getApiMethod.getApi(this.#connection.api);
      response = await (itemsApi[getApiMethod.getItems] as any)(apiParams);
    }
    else {
      const itemsApi = getItemsApi(this.#connection.api);
      response = await itemsApi.getItems(apiParams);
    }

    const responseItems = response.data?.Items || [];
    const filtered = await this.parseItemDtos(responseItems, parser);
    const itemsResult: GetItemsResult<T> = {
      items: filtered,
      startIndex: params.startIndex || 0, // Don't use StartIndex from response (possibly always 0)
      total: response.data.TotalRecordCount || 0,
      omitted: responseItems.length - filtered.length
    };

    const nextStartIndex = itemsResult.startIndex + responseItems.length;
    if (itemsResult.total > nextStartIndex) {
      itemsResult.nextStartIndex = nextStartIndex;
    }

    return itemsResult;
  }

  protected async parseItemDtos<T>(items: BaseItemDto[], parser: Parser<T>, filterNull?: true): Promise<T[]>;
  protected async parseItemDtos<T>(items: BaseItemDto[], parser: Parser<T>, filterNull: false): Promise<(T | null)[]>;
  protected async parseItemDtos<T>(items: BaseItemDto[], parser: Parser<T>, filterNull = true): Promise<(T | null)[]> {
    const parsePromises = items.map<Promise<T | null>>((data: any) => parser.parseDto(data, this.#connection.api));
    const parsedItems = await Promise.all<T | null>(parsePromises);
    return filterNull ? parsedItems.filter((item) => item !== null) : parsedItems;
  }

  async getItemFromApi<T>(params: GetItemParams, parser: Parser<T>): Promise<T | null> {
    const apiParams = this.#toApiGetItemParams(params);
    const userLibraryApi = getUserLibraryApi(this.#connection.api);
    const response = await userLibraryApi.getItem(apiParams);
    return parser.parseDto(response.data, this.#connection.api);
  }

  #toApiGetItemsParams(params: GetItemsParams): ItemsApiGetItemsRequest {
    if (!this.#connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    const result: Mutable<ItemsApiGetItemsRequest> = {
      userId: this.#connection.auth.User.Id,
      enableImageTypes: [ ImageType.Primary ],
      imageTypeLimit: 1,
      recursive: true
    };

    if (params.parentId) {
      result.parentId = params.parentId;
    }

    result.startIndex = params.startIndex || 0;

    if (params.limit === undefined || params.limit >= 0) {
      result.limit = params.limit || 47;
    }
    //Limit: jellyfin.getConfigValue<number>('itemsPerPage', 47),

    if (params.sortBy !== null) {
      result.sortBy = this.#ensureTypedArray(params.sortBy);
      if (result.sortBy.length === 0) {
        result.sortBy.push('SortName');
      }
    }

    if (params.sortOrder !== null) {
      result.sortOrder = this.#ensureTypedArray(params.sortOrder);
      if (result.sortOrder.length === 0) {
        result.sortOrder.push(SortOrder.Ascending);
      }
    }

    if (params.recursive !== undefined) {
      result.recursive = params.recursive;
    }

    const itemFields = this.#ensureTypedArray(params.fields);
    if (itemFields.length > 0) {
      result.fields = itemFields;
    }

    const itemFilters = this.#ensureTypedArray(params.filters);
    if (itemFilters.length > 0) {
      result.filters = itemFilters;
    }

    if (params.nameStartsWith) {
      result.nameStartsWith = params.nameStartsWith;
    }

    const itemTypes = this.#ensureTypedArray(params.itemTypes);
    if (itemTypes.length > 0) {
      result.includeItemTypes = itemTypes.map((t) => {
        switch (t) {
          case EntityType.Album:
            return BaseItemKind.MusicAlbum;

          case EntityType.Artist:
            return BaseItemKind.MusicArtist;

          case EntityType.Genre:
            return BaseItemKind.MusicGenre;

          case EntityType.Playlist:
            return BaseItemKind.Playlist;

          case EntityType.Song:
          default:
            return BaseItemKind.Audio;
        }
      });
    }

    const excludeItemTypes = this.#ensureTypedArray(params.excludeItemTypes);
    if (excludeItemTypes.length > 0) {
      result.excludeItemTypes = excludeItemTypes.map((t) => {
        switch (t) {
          case EntityType.Album:
            return BaseItemKind.MusicAlbum;

          case EntityType.Artist:
            return BaseItemKind.MusicArtist;

          case EntityType.Genre:
            return BaseItemKind.MusicGenre;

          case EntityType.Playlist:
            return BaseItemKind.Playlist;

          case EntityType.Song:
          default:
            return BaseItemKind.Audio;
        }
      });
    }

    const excludeItemIds = this.#ensureTypedArray(params.excludeItemIds);
    if (excludeItemIds.length > 0) {
      result.excludeItemIds = excludeItemIds;
    }

    const genreIds = this.#ensureTypedArray(params.genreIds);
    if (genreIds.length > 0) {
      result.genreIds = genreIds;
    }

    const artistIds = this.#ensureTypedArray(params.artistIds);
    if (artistIds.length > 0) {
      result.artistIds = artistIds;
    }

    const albumArtistIds = this.#ensureTypedArray(params.albumArtistIds);
    if (albumArtistIds.length > 0) {
      result.albumArtistIds = albumArtistIds;
    }

    const contributingArtistIds = this.#ensureTypedArray(params.contributingArtistIds);
    if (contributingArtistIds.length > 0) {
      result.contributingArtistIds = contributingArtistIds;
    }

    if (params.years) {
      if (Array.isArray(params.years)) {
        result.years = params.years;
      }
      else if (typeof params.years === 'string') {
        result.years = params.years.split(',').map((yearStr) => parseInt(yearStr, 10));
      }
    }

    if (params.search) {
      result.searchTerm = params.search;
    }

    return result;
  }

  #toApiGetItemParams(params: GetItemParams): UserLibraryApiGetItemRequest {
    if (!this.#connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    return {
      userId: this.#connection.auth?.User?.Id,
      itemId: params.itemId
    };
  }

  async getFiltersFromApi(params: GetFiltersParams): Promise<GetFiltersResult> {
    const apiParams = this.#toApiGetFiltersParams(params);
    const filtersApi = getFilterApi(this.#connection.api);
    const response = await filtersApi.getQueryFiltersLegacy(apiParams);
    const data = response.data;
    return {
      years: data.Years || null
    };
  }

  #toApiGetFiltersParams(params: GetFiltersParams): FilterApiGetQueryFiltersLegacyRequest {
    if (!this.#connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    const result: Mutable<FilterApiGetQueryFiltersLegacyRequest> = {
      userId: this.#connection.auth.User.Id,
      parentId: params.parentId
    };
    if (params.itemTypes) {
      result.includeItemTypes = params.itemTypes.map((t) => {
        switch (t) {
          case EntityType.Album:
            return BaseItemKind.MusicAlbum;

          case EntityType.Song:
          default: // Song
            return BaseItemKind.Audio;
        }
      });
    }
    return result;
  }

  async markFavorite(itemId: string): Promise<boolean> {
    if (!this.connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    const userLibraryApi = getUserLibraryApi(this.connection.api);
    const markFavoriteResponse = await userLibraryApi.markFavoriteItem({
      itemId,
      userId: this.connection.auth.User.Id
    });
    return !!markFavoriteResponse.data.IsFavorite;
  }

  async unmarkFavorite(itemId: string): Promise<boolean> {
    if (!this.connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    const userLibraryApi = getUserLibraryApi(this.connection.api);
    const unmarkFavoriteResponse = await userLibraryApi.unmarkFavoriteItem({
      itemId,
      userId: this.connection.auth.User.Id
    });
    return !!unmarkFavoriteResponse.data.IsFavorite;
  }

  #ensureTypedArray<T>(value?: string | string[] | T[]): T[] {
    if (!value) {
      return [];
    }
    if (typeof value === 'string') {
      return value.split(',') as T[];
    }
    return value as T[];
  }

  get connection(): ServerConnection {
    return this.#connection;
  }
}
