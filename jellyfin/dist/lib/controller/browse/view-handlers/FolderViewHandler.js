"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const FilterableViewHandler_1 = __importDefault(require("./FilterableViewHandler"));
class FolderViewHandler extends FilterableViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const { lists, modelQueryParams } = await this.handleFilters();
        const model = this.getModel(model_1.ModelType.Folder);
        const folder = await model.getFolder(view.parentId);
        const folderContents = await model.getFolderContents(modelQueryParams);
        const listItems = folderContents.items.map((item) => {
            switch (item.type) {
                case entities_1.EntityType.Folder:
                case entities_1.EntityType.CollectionFolder:
                    return this.getRenderer(entities_1.EntityType.Folder).renderToListItem(item);
                case entities_1.EntityType.Artist:
                case entities_1.EntityType.AlbumArtist:
                    return this.getRenderer(entities_1.EntityType.Artist).renderToListItem(item);
                case entities_1.EntityType.Album:
                    return this.getRenderer(entities_1.EntityType.Album).renderToListItem(item);
                default:
                    return null;
            }
        }).filter((item) => item);
        if (folderContents.nextStartIndex) {
            const nextUri = this.constructNextUri(folderContents.nextStartIndex);
            listItems.push(this.constructNextPageItem(nextUri));
        }
        lists.push({
            availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
            items: listItems
        });
        lists[0].title = folder?.name;
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
    getFilterableViewConfig() {
        return {
            showFilters: true,
            saveFiltersKey: 'folder',
            filterTypes: [FilterModel_1.FilterType.Sort, FilterModel_1.FilterType.AZ]
        };
    }
}
exports.default = FolderViewHandler;
//# sourceMappingURL=FolderViewHandler.js.map