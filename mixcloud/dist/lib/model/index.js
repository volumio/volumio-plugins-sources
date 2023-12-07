"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelType = void 0;
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const CloudcastModel_1 = __importDefault(require("./CloudcastModel"));
const DiscoverModel_1 = __importDefault(require("./DiscoverModel"));
const PlaylistModel_1 = __importDefault(require("./PlaylistModel"));
const TagModel_1 = __importDefault(require("./TagModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
const LiveStreamModel_1 = __importDefault(require("./LiveStreamModel"));
var ModelType;
(function (ModelType) {
    ModelType["Cloudcast"] = "Cloudcast";
    ModelType["Discover"] = "Discover";
    ModelType["Playlist"] = "Playlist";
    ModelType["Tag"] = "Tag";
    ModelType["User"] = "User";
    ModelType["LiveStream"] = "LiveStream";
})(ModelType || (exports.ModelType = ModelType = {}));
const MODEL_TYPE_TO_CLASS = {
    [ModelType.Cloudcast]: CloudcastModel_1.default,
    [ModelType.Discover]: DiscoverModel_1.default,
    [ModelType.Playlist]: PlaylistModel_1.default,
    [ModelType.Tag]: TagModel_1.default,
    [ModelType.User]: UserModel_1.default,
    [ModelType.LiveStream]: LiveStreamModel_1.default
};
class Model {
    static getInstance(type) {
        if (MODEL_TYPE_TO_CLASS[type]) {
            return new MODEL_TYPE_TO_CLASS[type]();
        }
        throw Error(`Model not found for type ${ModelType}`);
    }
    static reset() {
        this.clearLibCache();
    }
    static clearLibCache() {
        mixcloud_fetch_1.default.cache.clear();
    }
}
exports.default = Model;
//# sourceMappingURL=index.js.map