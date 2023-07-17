"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
class MusicItemViewHandler extends ExplodableViewHandler_1.default {
    async getTracksOnExplode() {
        const explodeTrackData = this.currentView.explodeTrackData;
        if (!explodeTrackData) {
            throw Error('Operation not supported');
        }
        return explodeTrackData;
    }
}
exports.default = MusicItemViewHandler;
//# sourceMappingURL=MusicItemViewHandler.js.map