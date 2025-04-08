"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const renderers_1 = require("./renderers");
class SelectionViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const { selectionId, pageRef } = this.currentView;
        const selections = await this.getModel(model_1.ModelType.Selection).getSelections({
            mixed: true
        });
        const selection = selections.items.find((s) => s.id === selectionId);
        if (!selection) {
            throw Error('Failed to fetch selection');
        }
        const renderer = this.getRenderer(renderers_1.RendererType.Playlist);
        const offset = Number(pageRef?.pageToken) || 0;
        const limit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
        const nextOffset = offset + limit;
        const slice = selection?.items.slice(offset, nextOffset) || [];
        const listItems = slice.reduce((result, item) => {
            const rendered = renderer.renderToListItem(item);
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        if (nextOffset < selection.items.length) {
            const nextPageRef = this.constructPageRef(nextOffset.toString(), 0);
            if (nextPageRef) {
                listItems.push(this.constructNextPageItem(nextPageRef));
            }
        }
        const list = {
            title: selection?.title || '',
            availableListViews: ['list', 'grid'],
            items: listItems
        };
        return {
            navigation: {
                prev: { uri: '/' },
                lists: [list]
            }
        };
    }
}
exports.default = SelectionViewHandler;
//# sourceMappingURL=SelectionViewHandler.js.map