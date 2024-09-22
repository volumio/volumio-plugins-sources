"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../../../model");
const GenericViewHandler_1 = __importDefault(require("./GenericViewHandler"));
class PlaylistViewHandler extends GenericViewHandler_1.default {
    async getContents() {
        const endpoint = this.assertEndpointExists(this.getEndpoint());
        const model = this.getModel(model_1.ModelType.Playlist);
        const contents = await model.getContents(endpoint);
        return this.assertPageContents(contents);
    }
    getEndpoint(explode) {
        const view = this.currentView;
        if (!view.continuation) {
            const endpoints = view.endpoints;
            return (explode ? endpoints.watch : endpoints.browse) || null;
        }
        return super.getEndpoint();
    }
}
exports.default = PlaylistViewHandler;
//# sourceMappingURL=PlaylistViewHandler.js.map