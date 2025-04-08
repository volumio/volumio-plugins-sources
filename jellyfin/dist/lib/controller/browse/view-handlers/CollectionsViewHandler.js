"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
class CollectionsViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const model = this.getModel(model_1.ModelType.Collection);
        const renderer = this.getRenderer(entities_1.EntityType.Collection);
        const modelQueryParams = this.getModelQueryParams();
        const collections = await model.getCollections(modelQueryParams);
        const listItems = collections.items.map((collection) => renderer.renderToListItem(collection)).filter((item) => item);
        if (collections.nextStartIndex) {
            const nextUri = this.constructNextUri(collections.nextStartIndex);
            listItems.push(this.constructNextPageItem(nextUri));
        }
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists: [
                {
                    availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
                    items: listItems
                }
            ]
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
}
exports.default = CollectionsViewHandler;
//# sourceMappingURL=CollectionsViewHandler.js.map