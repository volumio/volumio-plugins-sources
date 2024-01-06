"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
class GenreViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const lists = [];
        const modelQueryParams = this.getModelQueryParams();
        const model = this.getModel(model_1.ModelType.Genre);
        const renderer = this.getRenderer(entities_1.EntityType.Genre);
        const genres = await model.getGenres(modelQueryParams);
        const listItems = genres.items.map((genre) => renderer.renderToListItem(genre)).filter((item) => item);
        if (genres.nextStartIndex) {
            const nextUri = this.constructNextUri(genres.nextStartIndex);
            listItems.push(this.constructNextPageItem(nextUri));
        }
        lists.push({
            availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
            items: listItems
        });
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
}
exports.default = GenreViewHandler;
//# sourceMappingURL=GenreViewHandler.js.map