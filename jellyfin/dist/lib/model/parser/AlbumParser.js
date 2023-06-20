"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../entities");
const BaseParser_1 = __importDefault(require("./BaseParser"));
class AlbumParser extends BaseParser_1.default {
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base) {
            return null;
        }
        const artists = data.ArtistItems?.reduce((result, artist) => {
            if (artist.Id && artist.Name) {
                result.push({
                    id: artist.Id,
                    name: artist.Name
                });
            }
            return result;
        }, []) || [];
        const result = {
            ...base,
            type: entities_1.EntityType.Album,
            albumArtist: data.AlbumArtist || null,
            artists,
            duration: data.RunTimeTicks ? this.ticksToSeconds(data.RunTimeTicks) : null,
            year: data.ProductionYear || null,
            genres: this.getGenres(data)
        };
        return result;
    }
}
exports.default = AlbumParser;
//# sourceMappingURL=AlbumParser.js.map