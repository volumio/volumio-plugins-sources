"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../../../model");
const MusicFolderViewHandler_1 = __importDefault(require("./MusicFolderViewHandler"));
class PodcastViewHandler extends MusicFolderViewHandler_1.default {
    modelGetContents(endpoint) {
        const model = this.getModel(model_1.ModelType.Endpoint);
        return model.getContents(endpoint);
    }
}
exports.default = PodcastViewHandler;
//# sourceMappingURL=PodcastViewHandler.js.map