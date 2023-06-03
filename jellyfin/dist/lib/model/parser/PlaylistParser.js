"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../entities");
const BaseParser_1 = __importDefault(require("./BaseParser"));
class PlaylistParser extends BaseParser_1.default {
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base) {
            return null;
        }
        const result = {
            ...base,
            type: entities_1.EntityType.Playlist
        };
        return result;
    }
}
exports.default = PlaylistParser;
//# sourceMappingURL=PlaylistParser.js.map