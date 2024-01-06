"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class ExplodableViewHandler extends BaseViewHandler_1.default {
    async explode() {
        const view = this.currentView;
        if (view.noExplode) {
            return [];
        }
        const tracks = await this.getTracksOnExplode();
        if (!Array.isArray(tracks)) {
            const trackInfo = await this.parseTrackForExplode(tracks);
            return trackInfo ? [trackInfo] : [];
        }
        const trackInfoPromises = tracks.map((track) => this.parseTrackForExplode(track));
        return (await Promise.all(trackInfoPromises)).filter((song) => song);
    }
    async parseTrackForExplode(track) {
        const trackUri = this.getTrackUri(track);
        if (!trackUri) {
            return null;
        }
        const trackName = track.streamUrl ? track.name : UIHelper_1.default.addNonPlayableText(track.name);
        return {
            service: 'bandcamp',
            uri: trackUri,
            albumart: track.thumbnail,
            artist: track.artist?.name,
            album: track.album?.name,
            name: trackName,
            title: trackName,
            duration: track.duration
        };
    }
    /**
     * Track uri:
     * bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
     */
    getTrackUri(track) {
        if (!track.url) {
            return null;
        }
        const artistUrl = track.artist?.url || null;
        const albumUrl = track.album?.url || artistUrl;
        const trackView = {
            name: 'track',
            trackUrl: track.url
        };
        if (artistUrl) {
            trackView.artistUrl = artistUrl;
        }
        if (albumUrl) {
            trackView.albumUrl = albumUrl;
        }
        return `bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`;
    }
}
exports.default = ExplodableViewHandler;
//# sourceMappingURL=ExplodableViewHandler.js.map