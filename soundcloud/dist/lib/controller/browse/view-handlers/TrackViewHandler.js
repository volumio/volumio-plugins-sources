"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
class TrackViewHandler extends ExplodableViewHandler_1.default {
    async browse() {
        const { pageRef, search, userId, topFeatured, myLikes, combinedSearch, inSection } = this.currentView;
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
        if (!search && userId === undefined && !topFeatured && !myLikes) {
            throw Error('Unknown criteria');
        }
        const modelParams = {};
        if (pageToken) {
            modelParams.pageToken = pageRef.pageToken;
        }
        if (pageOffset) {
            modelParams.pageOffset = pageRef.pageOffset;
        }
        if (search) {
            modelParams.search = search;
        }
        else if (userId) {
            modelParams.userId = Number(userId);
        }
        else if (topFeatured) {
            modelParams.topFeatured = true;
        }
        if (search && combinedSearch) {
            modelParams.limit = SoundCloudContext_1.default.getConfigValue('combinedSearchResults');
        }
        else if (inSection) {
            modelParams.limit = SoundCloudContext_1.default.getConfigValue('itemsPerSection');
        }
        else {
            modelParams.limit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
        }
        let tracks;
        if (myLikes) {
            tracks = await this.getModel(model_1.ModelType.Me).getLikes({ ...modelParams, type: 'track' });
        }
        else {
            tracks = await this.getModel(model_1.ModelType.Track).getTracks(modelParams);
        }
        const page = this.buildPageFromLoopFetchResult(tracks, {
            renderer: this.getRenderer(renderers_1.RendererType.Track),
            title: myLikes ? SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIKES') : SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS')
        });
        if (userId && !inSection) {
            const userData = await this.getModel(model_1.ModelType.User).getUser(Number(userId));
            if (userData) {
                const header = this.getRenderer(renderers_1.RendererType.User).renderToHeader(userData);
                if (header && page.navigation) {
                    page.navigation.info = header;
                }
            }
        }
        return page;
    }
    async getTracksOnExplode() {
        const { trackId, origin } = this.currentView;
        if (!trackId) {
            throw Error('No Track ID specified');
        }
        const track = await this.getModel(model_1.ModelType.Track).getTrack(Number(trackId));
        if (!track) {
            return [];
        }
        const explodedTrackInfo = { ...track };
        if (origin) {
            explodedTrackInfo.origin = origin;
        }
        return explodedTrackInfo;
    }
}
exports.default = TrackViewHandler;
//# sourceMappingURL=TrackViewHandler.js.map