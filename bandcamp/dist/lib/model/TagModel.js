"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class TagModel extends BaseModel_1.default {
    async getTags() {
        const tags = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tags'), () => bandcamp_fetch_1.default.limiter.tag.list());
        return {
            tags: tags.tags.map((tag) => EntityConverter_1.default.convertTag(tag)),
            locations: tags.locations.map((tag) => EntityConverter_1.default.convertTag(tag))
        };
    }
    async getRelatedTags(tags) {
        const related = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('relatedTags', tags), () => bandcamp_fetch_1.default.limiter.tag.getRelated({ tags }));
        let tagsArr;
        if (related.combo && related.combo.length > 0) {
            tagsArr = related.combo;
        }
        else {
            tagsArr = related.single.find((row) => row.related.length > 0)?.related;
        }
        if (tagsArr && tagsArr.length > 0) {
            return tagsArr.map((tag) => EntityConverter_1.default.convertTag(tag));
        }
        return [];
    }
}
exports.default = TagModel;
//# sourceMappingURL=TagModel.js.map