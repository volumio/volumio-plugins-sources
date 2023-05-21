"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const artists_api_1 = require("@jellyfin/sdk/lib/utils/api/artists-api");
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const ArtistParser_1 = __importDefault(require("./parser/ArtistParser"));
class ArtistModel extends BaseModel_1.default {
    async getArtists(params) {
        const parser = new ArtistParser_1.default(entities_1.EntityType.Artist);
        return this.getItemsFromAPI(params, parser, {
            getApi: (api) => (0, artists_api_1.getArtistsApi)(api),
            getItems: 'getArtists'
        });
    }
    getArtist(id) {
        const parser = new ArtistParser_1.default(entities_1.EntityType.Artist);
        return this.getItemFromApi({ itemId: id }, parser);
    }
    async getAlbumArtists(params) {
        const parser = new ArtistParser_1.default(entities_1.EntityType.AlbumArtist);
        return this.getItemsFromAPI(params, parser, {
            getApi: (api) => (0, artists_api_1.getArtistsApi)(api),
            getItems: 'getAlbumArtists'
        });
    }
    getAlbumArtist(id) {
        const parser = new ArtistParser_1.default(entities_1.EntityType.AlbumArtist);
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = ArtistModel;
//# sourceMappingURL=ArtistModel.js.map