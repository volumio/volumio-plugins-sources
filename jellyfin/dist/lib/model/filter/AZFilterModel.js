"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const BaseModel_1 = __importDefault(require("../BaseModel"));
const FilterModel_1 = require("./FilterModel");
const AZ = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
class AZFilterModel extends BaseModel_1.default {
    async getFilter(config) {
        const options = AZ.map((c) => ({
            name: c,
            value: c,
            selected: c === config?.initialSelection?.nameStartsWith
        }));
        return {
            type: FilterModel_1.FilterType.AZ,
            title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_AZ_TITLE'),
            placeholder: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_AZ_PLACEHOLDER'),
            field: 'nameStartsWith',
            icon: 'fa fa-font',
            resettable: true,
            options
        };
    }
    async getDefaultSelection() {
        return {
            nameStartsWith: undefined
        };
    }
}
exports.default = AZFilterModel;
//# sourceMappingURL=AZFilterModel.js.map