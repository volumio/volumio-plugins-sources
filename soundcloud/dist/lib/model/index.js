"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelType = void 0;
const AlbumModel_1 = __importDefault(require("./AlbumModel"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const HistoryModel_1 = __importDefault(require("./HistoryModel"));
const MeModel_1 = __importDefault(require("./MeModel"));
const PlaylistModel_1 = __importDefault(require("./PlaylistModel"));
const SelectionModel_1 = __importDefault(require("./SelectionModel"));
const TrackModel_1 = __importDefault(require("./TrackModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
var ModelType;
(function (ModelType) {
    ModelType["Album"] = "Album";
    ModelType["Playlist"] = "Playlist";
    ModelType["Selection"] = "Selection";
    ModelType["Track"] = "Track";
    ModelType["User"] = "User";
    ModelType["History"] = "History";
    ModelType["Me"] = "Me";
})(ModelType = exports.ModelType || (exports.ModelType = {}));
const MODEL_TYPE_TO_CLASS = {
    [ModelType.Album]: AlbumModel_1.default,
    [ModelType.Playlist]: PlaylistModel_1.default,
    [ModelType.Selection]: SelectionModel_1.default,
    [ModelType.Track]: TrackModel_1.default,
    [ModelType.User]: UserModel_1.default,
    [ModelType.History]: HistoryModel_1.default,
    [ModelType.Me]: MeModel_1.default
};
class Model {
    static getInstance(type) {
        if (MODEL_TYPE_TO_CLASS[type]) {
            return new MODEL_TYPE_TO_CLASS[type]();
        }
        throw Error(`Model not found for type ${ModelType}`);
    }
    static setAccessToken(value) {
        BaseModel_1.default.setAccessToken(value);
    }
    static setLocale(value) {
        BaseModel_1.default.setLocale(value);
    }
}
exports.default = Model;
//# sourceMappingURL=index.js.map