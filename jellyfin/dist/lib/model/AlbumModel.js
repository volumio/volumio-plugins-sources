"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const library_api_1 = require("@jellyfin/sdk/lib/utils/api/library-api");
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const AlbumParser_1 = __importDefault(require("./parser/AlbumParser"));
class AlbumModel extends BaseModel_1.default {
    getAlbums(params) {
        const parser = new AlbumParser_1.default();
        return this.getItemsFromAPI({ ...params, itemTypes: entities_1.EntityType.Album }, parser);
    }
    getAlbum(id) {
        const parser = new AlbumParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
    async getSimilarAlbums(params) {
        if (!this.connection.auth?.User?.Id) {
            throw Error('No auth');
        }
        const parser = new AlbumParser_1.default();
        const libraryApi = (0, library_api_1.getLibraryApi)(this.connection.api);
        const response = await libraryApi.getSimilarAlbums({
            itemId: params.album.id,
            userId: this.connection.auth.User.Id,
            excludeArtistIds: params.album.artists.map((artist) => artist.id),
            limit: params.limit || 12
        });
        return this.parseItemDtos(response.data.Items || [], parser);
    }
}
exports.default = AlbumModel;
//# sourceMappingURL=AlbumModel.js.map