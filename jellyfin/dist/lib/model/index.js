"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelType = void 0;
const AlbumModel_1 = __importDefault(require("./AlbumModel"));
const ArtistModel_1 = __importDefault(require("./ArtistModel"));
const CollectionModel_1 = __importDefault(require("./CollectionModel"));
const AZFilterModel_1 = __importDefault(require("./filter/AZFilterModel"));
const FilterFilterModel_1 = __importDefault(require("./filter/FilterFilterModel"));
const GenreFilterModel_1 = __importDefault(require("./filter/GenreFilterModel"));
const SortFilterModel_1 = __importDefault(require("./filter/SortFilterModel"));
const YearFilterModel_1 = __importDefault(require("./filter/YearFilterModel"));
const FolderModel_1 = __importDefault(require("./FolderModel"));
const GenreModel_1 = __importDefault(require("./GenreModel"));
const PlaylistModel_1 = __importDefault(require("./PlaylistModel"));
const SongModel_1 = __importDefault(require("./SongModel"));
const UserViewModel_1 = __importDefault(require("./UserViewModel"));
var ModelType;
(function (ModelType) {
    ModelType["UserView"] = "UserView";
    ModelType["Album"] = "Album";
    ModelType["Playlist"] = "Playlist";
    ModelType["Artist"] = "Artist";
    ModelType["Genre"] = "Genre";
    ModelType["Song"] = "Song";
    ModelType["Collection"] = "Collection";
    ModelType["Folder"] = "Folder";
    ModelType["AZFilter"] = "AZFilter";
    ModelType["GenreFilter"] = "GenreFilter";
    ModelType["YearFilter"] = "YearFilter";
    ModelType["FilterFilter"] = "FilterFilter";
    ModelType["SortFilter"] = "SortFilter";
})(ModelType = exports.ModelType || (exports.ModelType = {}));
const MODEL_TYPE_TO_CLASS = {
    [ModelType.UserView]: UserViewModel_1.default,
    [ModelType.Album]: AlbumModel_1.default,
    [ModelType.Playlist]: PlaylistModel_1.default,
    [ModelType.Artist]: ArtistModel_1.default,
    [ModelType.Genre]: GenreModel_1.default,
    [ModelType.Song]: SongModel_1.default,
    [ModelType.Collection]: CollectionModel_1.default,
    [ModelType.Folder]: FolderModel_1.default,
    [ModelType.AZFilter]: AZFilterModel_1.default,
    [ModelType.GenreFilter]: GenreFilterModel_1.default,
    [ModelType.YearFilter]: YearFilterModel_1.default,
    [ModelType.FilterFilter]: FilterFilterModel_1.default,
    [ModelType.SortFilter]: SortFilterModel_1.default
};
class Model {
    static getInstance(type, connection) {
        if (MODEL_TYPE_TO_CLASS[type]) {
            return new MODEL_TYPE_TO_CLASS[type](connection);
        }
        throw Error(`Model not found for type ${ModelType}`);
    }
}
exports.default = Model;
//# sourceMappingURL=index.js.map