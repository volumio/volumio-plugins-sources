"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const item_fields_1 = require("@jellyfin/sdk/lib/generated-client/models/item-fields");
const lyrics_api_1 = require("@jellyfin/sdk/lib/utils/api/lyrics-api");
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const SongParser_1 = __importDefault(require("./parser/SongParser"));
const LyricsParser_1 = __importDefault(require("./parser/LyricsParser"));
class SongModel extends BaseModel_1.default {
    getSongs(params) {
        const parser = new SongParser_1.default();
        return this.getItemsFromAPI({
            ...params,
            itemTypes: entities_1.EntityType.Song,
            fields: [item_fields_1.ItemFields.MediaSources]
        }, parser);
    }
    getSong(id) {
        const parser = new SongParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
    async getLyrics(id) {
        const api = (0, lyrics_api_1.getLyricsApi)(this.connection.api);
        const dto = await api.getLyrics({ itemId: id });
        const parser = new LyricsParser_1.default();
        return parser.parseDto(dto.data);
    }
}
exports.default = SongModel;
//# sourceMappingURL=SongModel.js.map