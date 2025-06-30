"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelType = void 0;
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const AlbumModel_1 = __importDefault(require("./AlbumModel"));
const ArticleModel_1 = __importDefault(require("./ArticleModel"));
const BandModel_1 = __importDefault(require("./BandModel"));
const DiscoverModel_1 = __importDefault(require("./DiscoverModel"));
const FanModel_1 = __importDefault(require("./FanModel"));
const SearchModel_1 = __importDefault(require("./SearchModel"));
const ShowModel_1 = __importDefault(require("./ShowModel"));
const TagModel_1 = __importDefault(require("./TagModel"));
const TrackModel_1 = __importDefault(require("./TrackModel"));
var ModelType;
(function (ModelType) {
    ModelType["Album"] = "Album";
    ModelType["Article"] = "Article";
    ModelType["Band"] = "Band";
    ModelType["Discover"] = "Discover";
    ModelType["Fan"] = "Fan";
    ModelType["Search"] = "Search";
    ModelType["Show"] = "Show";
    ModelType["Tag"] = "Tag";
    ModelType["Track"] = "Track";
})(ModelType = exports.ModelType || (exports.ModelType = {}));
const MODEL_TYPE_TO_CLASS = {
    [ModelType.Album]: AlbumModel_1.default,
    [ModelType.Article]: ArticleModel_1.default,
    [ModelType.Band]: BandModel_1.default,
    [ModelType.Discover]: DiscoverModel_1.default,
    [ModelType.Fan]: FanModel_1.default,
    [ModelType.Search]: SearchModel_1.default,
    [ModelType.Show]: ShowModel_1.default,
    [ModelType.Tag]: TagModel_1.default,
    [ModelType.Track]: TrackModel_1.default
};
class Model {
    static getInstance(type) {
        if (MODEL_TYPE_TO_CLASS[type]) {
            return new MODEL_TYPE_TO_CLASS[type]();
        }
        throw Error(`Model not found for type ${ModelType}`);
    }
    static setCookie(value) {
        bandcamp_fetch_1.default.setCookie(value);
    }
    static get cookie() {
        return bandcamp_fetch_1.default.cookie;
    }
    static reset() {
        bandcamp_fetch_1.default.setCookie();
        this.clearLibCache();
    }
    static clearLibCache() {
        bandcamp_fetch_1.default.cache.clear();
    }
    static async ensureStreamURL(url) {
        const testResult = await bandcamp_fetch_1.default.stream.test(url);
        if (testResult.ok) {
            return url;
        }
        return await bandcamp_fetch_1.default.stream.refresh(url);
    }
}
exports.default = Model;
//# sourceMappingURL=index.js.map