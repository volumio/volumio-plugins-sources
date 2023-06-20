"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const model_1 = require("../../../model");
const Auth_1 = __importStar(require("../../../util/Auth"));
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
        const contentType = YouTube2Context_1.default.getConfigValue('rootContentType', 'full');
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
        const authStatus = Auth_1.default.getAuthStatus();
        if (authStatus.status === Auth_1.AuthStatus.SignedIn) {
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
        const contentType = YouTube2Context_1.default.getConfigValue('rootContentType', 'full');
        return contentType === 'simple' ? ['grid', 'list'] : ['list'];
    }
}
exports.default = RootViewHandler;
//# sourceMappingURL=RootViewHandler.js.map