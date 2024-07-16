"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../entities");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const AlbumParser_1 = __importDefault(require("./parser/AlbumParser"));
const ArtistParser_1 = __importDefault(require("./parser/ArtistParser"));
const CollectionParser_1 = __importDefault(require("./parser/CollectionParser"));
const PlaylistParser_1 = __importDefault(require("./parser/PlaylistParser"));
const SongParser_1 = __importDefault(require("./parser/SongParser"));
class CollectionModel extends BaseModel_1.default {
    getCollections(params) {
        const parser = new CollectionParser_1.default();
        const overrideParams = {
            ...params,
            recursive: false,
            sortBy: [models_1.ItemSortBy.IsFolder, models_1.ItemSortBy.SortName],
            sortOrder: models_1.SortOrder.Ascending
        };
        return this.getItemsFromAPI(overrideParams, parser);
    }
    getCollectionItems(params) {
        let parser;
        switch (params.itemType) {
            case entities_1.EntityType.Album:
                parser = new AlbumParser_1.default();
                break;
            case entities_1.EntityType.Artist:
                parser = new ArtistParser_1.default(entities_1.EntityType.Artist);
                break;
            case entities_1.EntityType.Playlist:
                parser = new PlaylistParser_1.default();
                break;
            case entities_1.EntityType.Song:
                parser = new SongParser_1.default();
                break;
            default:
                parser = null;
        }
        if (!parser) {
            throw Error('Unknown item type');
        }
        const normalizedParams = {
            ...params,
            recursive: false,
            sortBy: null,
            sortOrder: null,
            itemTypes: [params.itemType]
        };
        if (params.itemType === entities_1.EntityType.Playlist) {
            /**
             * We can't pass `itemType` like we did for other entity types. Jellyfin will
             * somehow return the wrong data. Instead, we use `excludeItemTypes`.
             * We assume the items returned are playlists, because it seems you can only add
             * Albums, Artists and Playlists to a Collection.
             */
            delete normalizedParams.itemTypes;
            normalizedParams.excludeItemTypes = 'Album,Artist,Song';
        }
        return this.getItemsFromAPI(normalizedParams, parser);
    }
    getCollection(id) {
        const parser = new CollectionParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = CollectionModel;
//# sourceMappingURL=CollectionModel.js.map