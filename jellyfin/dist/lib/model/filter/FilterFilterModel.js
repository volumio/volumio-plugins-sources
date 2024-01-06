"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../../entities");
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const BaseModel_1 = __importDefault(require("../BaseModel"));
const FilterModel_1 = require("./FilterModel");
const FILTER_SETS = {
    [entities_1.EntityType.Album]: [
        { i18nKey: 'JELLYFIN_FAVORITES', value: models_1.ItemFilter.IsFavorite }
    ],
    [entities_1.EntityType.Artist]: [
        { i18nKey: 'JELLYFIN_FAVORITES', value: models_1.ItemFilter.IsFavorite }
    ],
    [entities_1.EntityType.AlbumArtist]: [
        { i18nKey: 'JELLYFIN_FAVORITES', value: models_1.ItemFilter.IsFavorite }
    ],
    [entities_1.EntityType.Song]: [
        { i18nKey: 'JELLYFIN_FAVORITES', value: models_1.ItemFilter.IsFavorite },
        { i18nKey: 'JELLYFIN_PLAYED', value: models_1.ItemFilter.IsPlayed },
        { i18nKey: 'JELLYFIN_UNPLAYED', value: models_1.ItemFilter.IsUnplayed }
    ]
};
class FilterFilterModel extends BaseModel_1.default {
    async getFilter(config) {
        if (!config) {
            throw Error('Missing config');
        }
        const selectedValues = config.initialSelection?.filters || [];
        const options = FILTER_SETS[config.itemType].reduce((results, f) => {
            let value, selected = false;
            if (selectedValues.includes(f.value)) {
                value = selectedValues.join(',');
                selected = true;
            }
            else {
                const newSelectedValues = [...selectedValues, f.value];
                value = newSelectedValues.join(',');
            }
            results.push({
                name: JellyfinContext_1.default.getI18n(f.i18nKey),
                value,
                selected
            });
            return results;
        }, []);
        return {
            type: FilterModel_1.FilterType.Filter,
            title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_FILTER_TITLE'),
            placeholder: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_FILTER_PLACEHOLDER'),
            field: 'filters',
            icon: 'fa fa-filter',
            resettable: true,
            options
        };
    }
    async getDefaultSelection() {
        return {
            filters: undefined
        };
    }
}
exports.default = FilterFilterModel;
//# sourceMappingURL=FilterFilterModel.js.map