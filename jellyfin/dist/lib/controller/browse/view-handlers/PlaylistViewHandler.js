"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
class PlaylistViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const lists = [];
        const modelQueryParams = this.getModelQueryParams();
        const model = this.getModel(model_1.ModelType.Playlist);
        const renderer = this.getRenderer(entities_1.EntityType.Playlist);
        const playlists = await model.getPlaylists(modelQueryParams);
        const listItems = playlists.items.map((playlist) => renderer.renderToListItem(playlist)).filter((item) => item);
        if (playlists.nextStartIndex) {
            const nextUri = this.constructNextUri(playlists.nextStartIndex);
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
exports.default = PlaylistViewHandler;
//# sourceMappingURL=PlaylistViewHandler.js.map