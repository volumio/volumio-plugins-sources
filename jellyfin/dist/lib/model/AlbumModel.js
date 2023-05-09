"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.default = AlbumModel;
//# sourceMappingURL=AlbumModel.js.map