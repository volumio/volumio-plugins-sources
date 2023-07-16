"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_type_1 = require("@jellyfin/sdk/lib/generated-client/models/image-type");
const entities_1 = require("../../entities");
class BaseParser {
    async parseDto(data, api) {
        if (!data.Id || !data.Name) {
            return null;
        }
        const result = {
            type: entities_1.EntityType.Unknown,
            id: data.Id,
            name: data.Name,
            thumbnail: await this.getThumbnailUrl(data, api)
        };
        return result;
    }
    async getThumbnailUrl(data, api) {
        if (!data.Id || !data.ImageTags?.Primary) {
            return null;
        }
        return api.getItemImageUrl(data.Id, image_type_1.ImageType.Primary, {
            maxWidth: 500,
            maxHeight: 500,
            quality: 90
        }) || null;
    }
    ticksToSeconds(ticks) {
        if (ticks) {
            return Math.floor(ticks / 10000000);
        }
        return 0;
    }
    getGenres(data) {
        return data.GenreItems?.map((genre) => ({
            id: genre.Id,
            name: genre.Name
        })).filter((genre) => genre.id && genre.name) || [];
    }
}
exports.default = BaseParser;
//# sourceMappingURL=BaseParser.js.map