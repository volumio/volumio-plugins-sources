"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BaseModel_instances, _BaseModel_connection, _BaseModel_toApiGetItemsParams, _BaseModel_toApiGetItemParams, _BaseModel_toApiGetFiltersParams, _BaseModel_ensureTypedArray;
Object.defineProperty(exports, "__esModule", { value: true });
const items_api_1 = require("@jellyfin/sdk/lib/utils/api/items-api");
const user_library_api_1 = require("@jellyfin/sdk/lib/utils/api/user-library-api");
const filter_api_1 = require("@jellyfin/sdk/lib/utils/api/filter-api");
const sort_order_1 = require("@jellyfin/sdk/lib/generated-client/models/sort-order");
const image_type_1 = require("@jellyfin/sdk/lib/generated-client/models/image-type");
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../entities");
class BaseModel {
    constructor(connection) {
        _BaseModel_instances.add(this);
        _BaseModel_connection.set(this, void 0);
        __classPrivateFieldSet(this, _BaseModel_connection, connection, "f");
    }
    async getItemsFromAPI(params, parser, getApiMethod) {
        const apiParams = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_toApiGetItemsParams).call(this, params);
        let response;
        if (getApiMethod) {
            const itemsApi = getApiMethod.getApi(__classPrivateFieldGet(this, _BaseModel_connection, "f").api);
            response = await itemsApi[getApiMethod.getItems](apiParams);
        }
        else {
            const itemsApi = (0, items_api_1.getItemsApi)(__classPrivateFieldGet(this, _BaseModel_connection, "f").api);
            response = await itemsApi.getItems(apiParams);
        }
        const responseItems = response.data?.Items || [];
        const filtered = await this.parseItemDtos(responseItems, parser);
        const itemsResult = {
            items: filtered,
            startIndex: params.startIndex || 0,
            total: response.data.TotalRecordCount || 0,
            omitted: responseItems.length - filtered.length
        };
        const nextStartIndex = itemsResult.startIndex + responseItems.length;
        if (itemsResult.total > nextStartIndex) {
            itemsResult.nextStartIndex = nextStartIndex;
        }
        return itemsResult;
    }
    async parseItemDtos(items, parser, filterNull = true) {
        const parsePromises = items.map((data) => parser.parseDto(data, __classPrivateFieldGet(this, _BaseModel_connection, "f").api));
        const parsedItems = await Promise.all(parsePromises);
        return filterNull ? parsedItems.filter((item) => item !== null) : parsedItems;
    }
    async getItemFromApi(params, parser) {
        const apiParams = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_toApiGetItemParams).call(this, params);
        const userLibraryApi = (0, user_library_api_1.getUserLibraryApi)(__classPrivateFieldGet(this, _BaseModel_connection, "f").api);
        const response = await userLibraryApi.getItem(apiParams);
        return parser.parseDto(response.data, __classPrivateFieldGet(this, _BaseModel_connection, "f").api);
    }
    async getFiltersFromApi(params) {
        const apiParams = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_toApiGetFiltersParams).call(this, params);
        const filtersApi = (0, filter_api_1.getFilterApi)(__classPrivateFieldGet(this, _BaseModel_connection, "f").api);
        const response = await filtersApi.getQueryFiltersLegacy(apiParams);
        const data = response.data;
        return {
            years: data.Years || null
        };
    }
    async markFavorite(itemId) {
        if (!this.connection.auth?.User?.Id) {
            throw Error('No auth');
        }
        const userLibraryApi = (0, user_library_api_1.getUserLibraryApi)(this.connection.api);
        const markFavoriteResponse = await userLibraryApi.markFavoriteItem({
            itemId,
            userId: this.connection.auth.User.Id
        });
        return !!markFavoriteResponse.data.IsFavorite;
    }
    async unmarkFavorite(itemId) {
        if (!this.connection.auth?.User?.Id) {
            throw Error('No auth');
        }
        const userLibraryApi = (0, user_library_api_1.getUserLibraryApi)(this.connection.api);
        const unmarkFavoriteResponse = await userLibraryApi.unmarkFavoriteItem({
            itemId,
            userId: this.connection.auth.User.Id
        });
        return !!unmarkFavoriteResponse.data.IsFavorite;
    }
    get connection() {
        return __classPrivateFieldGet(this, _BaseModel_connection, "f");
    }
}
exports.default = BaseModel;
_BaseModel_connection = new WeakMap(), _BaseModel_instances = new WeakSet(), _BaseModel_toApiGetItemsParams = function _BaseModel_toApiGetItemsParams(params) {
    if (!__classPrivateFieldGet(this, _BaseModel_connection, "f").auth?.User?.Id) {
        throw Error('No auth');
    }
    const result = {
        userId: __classPrivateFieldGet(this, _BaseModel_connection, "f").auth.User.Id,
        enableImageTypes: [image_type_1.ImageType.Primary],
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
        result.sortBy = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.sortBy);
        if (result.sortBy.length === 0) {
            result.sortBy.push('SortName');
        }
    }
    if (params.sortOrder !== null) {
        result.sortOrder = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.sortOrder);
        if (result.sortOrder.length === 0) {
            result.sortOrder.push(sort_order_1.SortOrder.Ascending);
        }
    }
    if (params.recursive !== undefined) {
        result.recursive = params.recursive;
    }
    const itemFields = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.fields);
    if (itemFields.length > 0) {
        result.fields = itemFields;
    }
    const itemFilters = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.filters);
    if (itemFilters.length > 0) {
        result.filters = itemFilters;
    }
    if (params.nameStartsWith) {
        result.nameStartsWith = params.nameStartsWith;
    }
    const itemTypes = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.itemTypes);
    if (itemTypes.length > 0) {
        result.includeItemTypes = itemTypes.map((t) => {
            switch (t) {
                case entities_1.EntityType.Album:
                    return models_1.BaseItemKind.MusicAlbum;
                case entities_1.EntityType.Artist:
                    return models_1.BaseItemKind.MusicArtist;
                case entities_1.EntityType.Genre:
                    return models_1.BaseItemKind.MusicGenre;
                case entities_1.EntityType.Playlist:
                    return models_1.BaseItemKind.Playlist;
                case entities_1.EntityType.Song:
                default:
                    return models_1.BaseItemKind.Audio;
            }
        });
    }
    const excludeItemTypes = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.excludeItemTypes);
    if (excludeItemTypes.length > 0) {
        result.excludeItemTypes = excludeItemTypes.map((t) => {
            switch (t) {
                case entities_1.EntityType.Album:
                    return models_1.BaseItemKind.MusicAlbum;
                case entities_1.EntityType.Artist:
                    return models_1.BaseItemKind.MusicArtist;
                case entities_1.EntityType.Genre:
                    return models_1.BaseItemKind.MusicGenre;
                case entities_1.EntityType.Playlist:
                    return models_1.BaseItemKind.Playlist;
                case entities_1.EntityType.Song:
                default:
                    return models_1.BaseItemKind.Audio;
            }
        });
    }
    const excludeItemIds = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.excludeItemIds);
    if (excludeItemIds.length > 0) {
        result.excludeItemIds = excludeItemIds;
    }
    const genreIds = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.genreIds);
    if (genreIds.length > 0) {
        result.genreIds = genreIds;
    }
    const artistIds = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.artistIds);
    if (artistIds.length > 0) {
        result.artistIds = artistIds;
    }
    const albumArtistIds = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.albumArtistIds);
    if (albumArtistIds.length > 0) {
        result.albumArtistIds = albumArtistIds;
    }
    const contributingArtistIds = __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_ensureTypedArray).call(this, params.contributingArtistIds);
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
}, _BaseModel_toApiGetItemParams = function _BaseModel_toApiGetItemParams(params) {
    if (!__classPrivateFieldGet(this, _BaseModel_connection, "f").auth?.User?.Id) {
        throw Error('No auth');
    }
    return {
        userId: __classPrivateFieldGet(this, _BaseModel_connection, "f").auth?.User?.Id,
        itemId: params.itemId
    };
}, _BaseModel_toApiGetFiltersParams = function _BaseModel_toApiGetFiltersParams(params) {
    if (!__classPrivateFieldGet(this, _BaseModel_connection, "f").auth?.User?.Id) {
        throw Error('No auth');
    }
    const result = {
        userId: __classPrivateFieldGet(this, _BaseModel_connection, "f").auth.User.Id,
        parentId: params.parentId
    };
    if (params.itemTypes) {
        result.includeItemTypes = params.itemTypes.map((t) => {
            switch (t) {
                case entities_1.EntityType.Album:
                    return models_1.BaseItemKind.MusicAlbum;
                case entities_1.EntityType.Song:
                default: // Song
                    return models_1.BaseItemKind.Audio;
            }
        });
    }
    return result;
}, _BaseModel_ensureTypedArray = function _BaseModel_ensureTypedArray(value) {
    if (!value) {
        return [];
    }
    if (typeof value === 'string') {
        return value.split(',');
    }
    return value;
};
//# sourceMappingURL=BaseModel.js.map