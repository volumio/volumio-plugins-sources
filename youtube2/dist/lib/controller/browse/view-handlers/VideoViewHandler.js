"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
class VideoViewHandler extends ExplodableViewHandler_1.default {
    getTracksOnExplode() {
        const explodeTrackData = this.currentView.explodeTrackData;
        if (!explodeTrackData) {
            throw Error('Operation not supported');
        }
        return Promise.resolve(explodeTrackData);
    }
}
exports.default = VideoViewHandler;
//# sourceMappingURL=VideoViewHandler.js.map