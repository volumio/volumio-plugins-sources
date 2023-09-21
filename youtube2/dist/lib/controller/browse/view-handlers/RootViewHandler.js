"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const model_1 = require("../../../model");
const InnertubeLoader_1 = __importDefault(require("../../../model/InnertubeLoader"));
const Auth_1 = require("../../../util/Auth");
const FeedViewHandler_1 = __importDefault(require("./FeedViewHandler"));
class RootViewHandler extends FeedViewHandler_1.default {
    getTracksOnExplode() {
        throw Error('Operation not supported');
    }
    async browse() {
        const result = await super.browse();
        if (result.navigation?.lists && result.navigation.lists.length > 0) {
            result.navigation.lists[0].title = YouTube2Context_1.default.getI18n('YOUTUBE2_TITLE');
        }
        return result;
    }
    async getContents() {
        const contentType = YouTube2Context_1.default.getConfigValue('rootContentType');
        const rootModel = this.getModel(model_1.ModelType.Root);
        let contents = await rootModel.getContents({ contentType });
        if (!contents) {
            contents = {
                sections: []
            };
        }
        // We should never come to this, but just in case...
        else if (!contents.sections || contents.sections.length === 0) {
            contents.sections = [];
        }
        const { auth } = await InnertubeLoader_1.default.getInstance();
        if (auth.getStatus().status === Auth_1.AuthStatus.SignedIn) {
            const accountModel = this.getModel(model_1.ModelType.Account);
            const account = await accountModel.getInfo();
            if (account?.channel) {
                contents.sections.unshift({
                    type: 'section',
                    items: [
                        {
                            type: 'endpointLink',
                            title: account.channel.title,
                            thumbnail: account.photo,
                            endpoint: account.channel.endpoint
                        }
                    ]
                });
            }
        }
        if (contentType === 'simple' && contents.sections.length > 1) {
            // Place all items into one section
            const allItems = this.findAllItemsInSection(contents.sections);
            contents.sections = [
                {
                    ...contents.sections[0],
                    items: allItems
                }
            ];
        }
        return contents;
    }
    getAvailableListViews() {
        const contentType = YouTube2Context_1.default.getConfigValue('rootContentType');
        return contentType === 'simple' ? ['grid', 'list'] : ['list'];
    }
}
exports.default = RootViewHandler;
//# sourceMappingURL=RootViewHandler.js.map