"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SortFilterModel_instances, _SortFilterModel_getSortByFilter, _SortFilterModel_getSortOrderFilter;
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../../entities");
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const BaseModel_1 = __importDefault(require("../BaseModel"));
const FilterModel_1 = require("./FilterModel");
const SORT_BY_SETS = {
    [entities_1.EntityType.Album]: [
        { i18nKey: 'JELLYFIN_NAME', value: 'SortName' },
        { i18nKey: 'JELLYFIN_ALBUM_ARTIST', value: 'AlbumArtist,SortName' },
        { i18nKey: 'JELLYFIN_COMMUNITY_RATING', value: 'CommunityRating,SortName' },
        { i18nKey: 'JELLYFIN_CRITIC_RATING', value: 'CriticRating,SortName' },
        { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
        { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'ProductionYear,PremiereDate,SortName' },
        { i18nKey: 'JELLYFIN_RANDOM', value: 'Random,SortName' }
    ],
    [entities_1.EntityType.Song]: [
        { i18nKey: 'JELLYFIN_TRACK_NAME', value: 'Name' },
        { i18nKey: 'JELLYFIN_ALBUM', value: 'Album,SortName' },
        { i18nKey: 'JELLYFIN_ALBUM_ARTIST', value: 'AlbumArtist,Album,SortName' },
        { i18nKey: 'JELLYFIN_ARTIST', value: 'Artist,Album,SortName' },
        { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
        { i18nKey: 'JELLYFIN_DATE_PLAYED', value: 'DatePlayed,SortName' },
        { i18nKey: 'JELLYFIN_PLAY_COUNT', value: 'PlayCount,SortName' },
        { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'PremiereDate,AlbumArtist,Album,SortName' },
        { i18nKey: 'JELLYFIN_RUNTIME', value: 'Runtime,AlbumArtist,Album,SortName' },
        { i18nKey: 'JELLYFIN_RANDOM', value: 'Random,SortName' }
    ],
    [entities_1.EntityType.Folder]: [
        { i18nKey: 'JELLYFIN_NAME', value: 'SortName' },
        { i18nKey: 'JELLYFIN_COMMUNITY_RATING', value: 'CommunityRating,SortName' },
        { i18nKey: 'JELLYFIN_CRITIC_RATING', value: 'CriticRating,SortName' },
        { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
        { i18nKey: 'JELLYFIN_DATE_PLAYED', value: 'DatePlayed,SortName' },
        { i18nKey: 'JELLYFIN_FOLDERS', value: 'IsFolder,SortName', default: true },
        { i18nKey: 'JELLYFIN_PLAY_COUNT', value: 'PlayCount,SortName' },
        { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'ProductionYear,PremiereDate,SortName' },
        { i18nKey: 'JELLYFIN_RUNTIME', value: 'Runtime,SortName' }
    ]
};
const SORT_ORDERS = [
    { i18nKey: 'JELLYFIN_ASCENDING', value: models_1.SortOrder.Ascending },
    { i18nKey: 'JELLYFIN_DESCENDING', value: models_1.SortOrder.Descending }
];
class SortFilterModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _SortFilterModel_instances.add(this);
    }
    async getFilter(config) {
        if (!config) {
            throw Error('Missing config');
        }
        const sortByFilter = await __classPrivateFieldGet(this, _SortFilterModel_instances, "m", _SortFilterModel_getSortByFilter).call(this, config);
        const sortOrderFilter = __classPrivateFieldGet(this, _SortFilterModel_instances, "m", _SortFilterModel_getSortOrderFilter).call(this, config);
        return {
            type: FilterModel_1.FilterType.Sort,
            subfilters: [
                sortByFilter,
                sortOrderFilter
            ],
            icon: 'fa fa-sort',
            placeholder: ''
        };
    }
    async getDefaultSelection(targetType) {
        const defaultSortByIndex = Math.max(SORT_BY_SETS[targetType].findIndex((s) => s.default), 0);
        return {
            sortBy: SORT_BY_SETS[targetType][defaultSortByIndex].value,
            sortOrder: SORT_ORDERS[0].value
        };
    }
}
exports.default = SortFilterModel;
_SortFilterModel_instances = new WeakSet(), _SortFilterModel_getSortByFilter = async function _SortFilterModel_getSortByFilter(config) {
    const defaultSortBy = (await this.getDefaultSelection(config.itemType)).sortBy;
    const selectedSortByValue = config.initialSelection?.sortBy || defaultSortBy;
    const options = SORT_BY_SETS[config.itemType].map((sortBy) => ({
        name: JellyfinContext_1.default.getI18n(sortBy.i18nKey),
        value: sortBy.value,
        selected: selectedSortByValue == sortBy.value
    }));
    return {
        title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_SORT_BY_TITLE'),
        field: 'sortBy',
        icon: 'fa fa-sort',
        resettable: false,
        placeholder: '',
        options
    };
}, _SortFilterModel_getSortOrderFilter = function _SortFilterModel_getSortOrderFilter(config) {
    const selectedSortOrderValue = config.initialSelection?.sortOrder || SORT_ORDERS[0].value;
    const options = SORT_ORDERS.map((sortOrder) => ({
        name: JellyfinContext_1.default.getI18n(sortOrder.i18nKey),
        value: sortOrder.value,
        selected: selectedSortOrderValue == sortOrder.value
    }));
    return {
        title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_SORT_ORDER_TITLE'),
        field: 'sortOrder',
        icon: 'fa fa-sort',
        resettable: false,
        placeholder: '',
        options
    };
};
//# sourceMappingURL=SortFilterModel.js.map