"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../../../model");
const Endpoint_1 = require("../../../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("../../../util/EndpointHelper"));
const MusicFolderViewHandler_1 = __importDefault(require("./MusicFolderViewHandler"));
class PlaylistViewHandler extends MusicFolderViewHandler_1.default {
    modelGetContents(endpoint) {
        const model = this.getModel(model_1.ModelType.Playlist);
        return model.getContents(endpoint);
    }
    getEndpoint(explode) {
        const endpoint = super.getEndpoint(explode);
        if (explode && EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Watch)) {
            // `PlaylistView.endpoints.watch` returns tracks in random order. Remove `params` from endpoint for default ordering.
            delete endpoint.payload.params;
        }
        return endpoint;
    }
}
exports.default = PlaylistViewHandler;
//# sourceMappingURL=PlaylistViewHandler.js.map