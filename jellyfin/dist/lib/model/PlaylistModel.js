"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const PlaylistParser_1 = __importDefault(require("./parser/PlaylistParser"));
class PlaylistModel extends BaseModel_1.default {
    async getPlaylists(params) {
        const parser = new PlaylistParser_1.default();
        return this.getItemsFromAPI({ ...params, itemTypes: entities_1.EntityType.Playlist }, parser);
    }
    getPlaylist(id) {
        const parser = new PlaylistParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = PlaylistModel;
//# sourceMappingURL=PlaylistModel.js.map