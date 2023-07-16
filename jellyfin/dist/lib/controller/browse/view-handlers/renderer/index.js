"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../../entities");
const AlbumRenderer_1 = __importDefault(require("./AlbumRenderer"));
const ArtistRenderer_1 = __importDefault(require("./ArtistRenderer"));
const CollectionRenderer_1 = __importDefault(require("./CollectionRenderer"));
const FolderRenderer_1 = __importDefault(require("./FolderRenderer"));
const GenreRenderer_1 = __importDefault(require("./GenreRenderer"));
const PlaylistRenderer_1 = __importDefault(require("./PlaylistRenderer"));
const ServerRenderer_1 = __importDefault(require("./ServerRenderer"));
const SongRenderer_1 = __importDefault(require("./SongRenderer"));
const UserViewRenderer_1 = __importDefault(require("./UserViewRenderer"));
const ENTITY_TYPE_TO_CLASS = {
    [entities_1.EntityType.Album]: AlbumRenderer_1.default,
    [entities_1.EntityType.Artist]: ArtistRenderer_1.default,
    [entities_1.EntityType.AlbumArtist]: ArtistRenderer_1.default,
    [entities_1.EntityType.Collection]: CollectionRenderer_1.default,
    [entities_1.EntityType.Folder]: FolderRenderer_1.default,
    [entities_1.EntityType.CollectionFolder]: FolderRenderer_1.default,
    [entities_1.EntityType.Genre]: GenreRenderer_1.default,
    [entities_1.EntityType.Playlist]: PlaylistRenderer_1.default,
    [entities_1.EntityType.Server]: ServerRenderer_1.default,
    [entities_1.EntityType.Song]: SongRenderer_1.default,
    [entities_1.EntityType.UserView]: UserViewRenderer_1.default
};
class Renderer {
    static getInstance(type, uri, currentView, previousViews, albumArtHandler) {
        const cl = ENTITY_TYPE_TO_CLASS[type];
        if (cl) {
            return new cl(uri, currentView, previousViews, albumArtHandler);
        }
        throw Error(`Renderer not found for type ${entities_1.EntityType}`);
    }
}
exports.default = Renderer;
//# sourceMappingURL=index.js.map