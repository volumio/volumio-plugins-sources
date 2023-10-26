"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genres_api_1 = require("@jellyfin/sdk/lib/utils/api/genres-api");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const GenreParser_1 = __importDefault(require("./parser/GenreParser"));
class GenreModel extends BaseModel_1.default {
    async getGenres(params) {
        const parser = new GenreParser_1.default();
        return this.getItemsFromAPI(params, parser, {
            getApi: (api) => (0, genres_api_1.getGenresApi)(api),
            getItems: 'getGenres'
        });
    }
    getGenre(id) {
        const parser = new GenreParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = GenreModel;
//# sourceMappingURL=GenreModel.js.map