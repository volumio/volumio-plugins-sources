"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHandlerFactory_1 = __importDefault(require("../controller/browse/view-handlers/ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
const model_1 = require("../model");
class SongHelper {
    static async setFavoriteByUri(uri, favorite, connectionManager) {
        const handler = await ViewHandlerFactory_1.default.getHandler(uri, connectionManager);
        const songId = handler.currentView.songId;
        if (handler.currentView.name !== 'song' || !songId) {
            throw Error(`Failed to obtain song Id from uri: ${uri}`);
        }
        const songModel = handler.getModel(model_1.ModelType.Song);
        let favoriteResult;
        if (favorite) {
            favoriteResult = await songModel.markFavorite(songId);
        }
        else {
            favoriteResult = await songModel.unmarkFavorite(songId);
        }
        if (favoriteResult !== favorite) {
            throw Error('Updated status in response does not match value requested');
        }
        return {
            songId,
            canonicalUri: this.getCanonicalUri(songId, handler.serverConnection),
            favorite: favoriteResult
        };
    }
    // Canonical URI format:
    // Jellyfin/{username}@{serverId}/song@songId={songId}
    static getCanonicalUri(songTarget, connection) {
        if (typeof songTarget === 'object') {
            return this.getCanonicalUri(songTarget.id, connection);
        }
        if (connection) {
            const songView = {
                name: 'song',
                songId: songTarget
            };
            return `jellyfin/${connection.id}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
        }
        return null;
    }
}
exports.default = SongHelper;
//# sourceMappingURL=SongHelper.js.map