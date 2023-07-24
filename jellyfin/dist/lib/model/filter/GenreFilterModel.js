"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const BaseModel_1 = __importDefault(require("../BaseModel"));
const GenreModel_1 = __importDefault(require("../GenreModel"));
const FilterModel_1 = require("./FilterModel");
class GenreFilterModel extends BaseModel_1.default {
    async getFilter(config) {
        if (!config) {
            throw Error('Missing config');
        }
        const selectedGenreIds = config.initialSelection?.genreIds || [];
        const model = new GenreModel_1.default(this.connection);
        const genres = await model.getGenres({
            parentId: config.parentId
        });
        const options = genres.items.reduce((results, genre) => {
            let value, selected = false;
            if (selectedGenreIds.includes(genre.id)) {
                value = selectedGenreIds.join(',');
                selected = true;
            }
            else {
                const newSelectedValues = [...selectedGenreIds, genre.id];
                value = newSelectedValues.join(',');
            }
            results.push({
                name: genre.name,
                value,
                selected
            });
            return results;
        }, []);
        return {
            type: FilterModel_1.FilterType.Genre,
            title: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_GENRE_TITLE'),
            placeholder: JellyfinContext_1.default.getI18n('JELLYFIN_FILTER_GENRE_PLACEHOLDER'),
            field: 'genreIds',
            icon: 'fa fa-music',
            resettable: true,
            options
        };
    }
    async getDefaultSelection() {
        return {
            genreIds: []
        };
    }
}
exports.default = GenreFilterModel;
//# sourceMappingURL=GenreFilterModel.js.map