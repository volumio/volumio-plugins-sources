"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExplodeHelper_1 = __importDefault(require("../../../util/ExplodeHelper"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
class ExplodableViewHandler extends BaseViewHandler_1.default {
    async explode() {
        const view = this.currentView;
        if (view.noExplode) {
            return [];
        }
        const tracks = await this.getTracksOnExplode();
        if (!Array.isArray(tracks)) {
            const trackInfo = ExplodeHelper_1.default.createQueueItemFromExplodedTrackInfo(tracks);
            return trackInfo ? [trackInfo] : [];
        }
        return tracks.reduce((result, track) => {
            const qi = ExplodeHelper_1.default.createQueueItemFromExplodedTrackInfo(track);
            if (qi) {
                result.push(qi);
            }
            return result;
        }, []);
    }
}
exports.default = ExplodableViewHandler;
//# sourceMappingURL=ExplodableViewHandler.js.map