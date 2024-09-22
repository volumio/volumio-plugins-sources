"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const Endpoint_1 = require("../../../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("../../../util/EndpointHelper"));
const GenericViewHandler_1 = __importDefault(require("./GenericViewHandler"));
class MusicFolderViewHandler extends GenericViewHandler_1.default {
    async getContents() {
        const endpoint = this.assertEndpointExists(this.getEndpoint());
        if (EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation)) {
            const contents = await this.modelGetContents(endpoint);
            return this.assertPageContents(contents);
        }
        YTMusicContext_1.default.toast('error', YTMusicContext_1.default.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
        throw Error(YTMusicContext_1.default.getI18n('YTMUSIC_ERR_ENDPOINT_INVALID'));
    }
    getEndpoint(explode) {
        const view = this.currentView;
        if (!view.continuation) {
            const endpoints = view.endpoints;
            return (explode ? endpoints.watch : endpoints.browse) || null;
        }
        return super.getEndpoint(explode);
    }
}
exports.default = MusicFolderViewHandler;
//# sourceMappingURL=MusicFolderViewHandler.js.map