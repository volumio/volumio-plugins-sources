"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../entities");
const BaseParser_1 = __importDefault(require("./BaseParser"));
class SongParser extends BaseParser_1.default {
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base) {
            return null;
        }
        const artists = data.ArtistItems?.map((artist) => ({
            id: artist.Id,
            name: artist.Name
        })).filter((artist) => artist.id && artist.name) || [];
        let albumThumbnail = null;
        if (data.AlbumId && data.AlbumPrimaryImageTag) {
            const albumThumbnailData = {
                Id: data.AlbumId,
                ImageTags: {
                    Primary: data.AlbumPrimaryImageTag
                }
            };
            albumThumbnail = await super.getThumbnailUrl(albumThumbnailData, api);
        }
        const album = data.Album && data.AlbumId ? {
            id: data.AlbumId,
            name: data.Album,
            thumbnail: albumThumbnail
        } : null;
        const result = {
            ...base,
            type: entities_1.EntityType.Song,
            artists,
            album,
            duration: data.RunTimeTicks ? this.ticksToSeconds(data.RunTimeTicks) : 0,
            favorite: !!data.UserData?.IsFavorite
        };
        if (data.MediaSources) {
            result.mediaSources = data.MediaSources;
        }
        if (!result.thumbnail && albumThumbnail) {
            result.thumbnail = albumThumbnail;
        }
        return result;
    }
}
exports.default = SongParser;
//# sourceMappingURL=SongParser.js.map