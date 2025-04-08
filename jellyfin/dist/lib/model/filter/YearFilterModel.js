"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const BaseModel_1 = __importDefault(require("../BaseModel"));
const FilterModel_1 = require("./FilterModel");
class YearFilterModel extends BaseModel_1.default {
    async getFilter(config) {
        if (!config) {
            throw Error('Missing config');
        }
        const selectedYears = config.initialSelection?.years || [];
        const params = {
            parentId: config.parentId,
            itemTypes: [config.itemType]
        };
        const apiFilters = await this.getFiltersFromApi(params);
        const options = apiFilters.years?.reduce((results, year) => {
            let value, selected = false;
            const yearStr = String(year);
            if (selectedYears.includes(yearStr)) {
                value = selectedYears.join(',');
                selected = true;
            }
            else {
                const newSelectedValues = [...selectedYears, year];
                value = newSelectedValues.join(',');
            }
            results.push({
                name: yearStr,
                value,
                selected
            });
            return results;
        }, []);
        return {
            type: FilterModel_1.FilterType.Year,
            title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_YEAR_TITLE'),
            placeholder: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_YEAR_PLACEHOLDER'),
            field: 'years',
            icon: 'fa fa-calendar-o',
            resettable: true,
            options
        };
    }
    async getDefaultSelection() {
        return {
            years: undefined
        };
    }
}
exports.default = YearFilterModel;
//# sourceMappingURL=YearFilterModel.js.map