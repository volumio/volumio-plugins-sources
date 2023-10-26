"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const item_fields_1 = require("@jellyfin/sdk/lib/generated-client/models/item-fields");
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const SongParser_1 = __importDefault(require("./parser/SongParser"));
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
}
exports.default = SongModel;
//# sourceMappingURL=SongModel.js.map