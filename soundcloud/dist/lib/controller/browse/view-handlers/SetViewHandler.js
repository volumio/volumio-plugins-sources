"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
class SetViewHandler extends ExplodableViewHandler_1.default {
    browse() {
        const view = this.currentView;
        const id = this.getSetIdFromView();
        if (view.search) {
            return this.browseSearch(view.search);
        }
        else if (view.userId) {
            return this.browseByUser(Number(view.userId));
        }
        else if (id !== null && id !== undefined) {
            return this.browseSet(id);
        }
        throw Error('Unknown criteria');
    }
    async browseSearch(query) {
        const { combinedSearch, pageRef } = this.currentView;
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
        const limit = combinedSearch ? SoundCloudContext_1.default.getConfigValue('combinedSearchResults') : SoundCloudContext_1.default.getConfigValue('itemsPerPage');
        const modelParams = { search: query };
        if (pageToken !== undefined) {
            modelParams.pageToken = pageToken;
        }
        if (pageOffset !== undefined) {
            modelParams.pageOffset = pageOffset;
        }
        modelParams.limit = limit;
        const result = await this.getSets(modelParams);
        return this.buildPageFromLoopFetchResult(result, {
            renderer: this.getSetRenderer(),
            title: this.getSetsListTitle()
        });
    }
    async browseByUser(userId) {
        const { pageRef, inSection } = this.currentView;
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
        const limit = inSection ? SoundCloudContext_1.default.getConfigValue('itemsPerSection') : SoundCloudContext_1.default.getConfigValue('itemsPerPage');
        const modelParams = { userId };
        if (pageToken !== undefined) {
            modelParams.pageToken = pageToken;
        }
        if (pageOffset !== undefined) {
            modelParams.pageOffset = pageOffset;
        }
        modelParams.limit = limit;
        const result = await this.getSets(modelParams);
        const page = this.buildPageFromLoopFetchResult(result, {
            renderer: this.getSetRenderer(),
            title: this.getSetsListTitle()
        });
        if (!inSection && page.navigation) {
            const userData = await this.getModel(model_1.ModelType.User).getUser(userId);
            if (userData) {
                const header = this.getRenderer(renderers_1.RendererType.User).renderToHeader(userData);
                if (header) {
                    page.navigation.info = header;
                }
            }
        }
        return page;
    }
    async browseSet(id) {
        const { set, tracksOffset, tracksLimit } = await this.getSet(id);
        const origin = this.getTrackOrigin(set);
        const renderer = this.getRenderer(renderers_1.RendererType.Track);
        const listItems = set.tracks.reduce((result, track) => {
            const rendered = renderer.renderToListItem(track, origin);
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        if (!SoundCloudContext_1.default.getConfigValue('loadFullPlaylistAlbum') && tracksLimit !== undefined) {
            const nextOffset = (tracksOffset || 0) + tracksLimit;
            if ((set.trackCount || 0) > nextOffset) {
                const nextPageRef = this.constructPageRef(nextOffset.toString(), 0);
                if (nextPageRef) {
                    listItems.push(this.constructNextPageItem(nextPageRef));
                }
            }
        }
        let title = this.currentView.title || SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS');
        if (set.permalink) {
            title = this.addLinkToListTitle(title, set.permalink, this.getVisitLinkTitle());
        }
        const list = {
            title,
            availableListViews: ['list', 'grid'],
            items: listItems
        };
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                info: this.getSetRenderer().renderToHeader(set),
                lists: [list]
            }
        };
    }
    async getTracksOnExplode() {
        const id = this.getSetIdFromView();
        if (id === undefined || id === null) {
            throw Error('Id of target not specified');
        }
        const { set } = await this.getSet(id);
        const origin = set ? this.getTrackOrigin(set) : null;
        const trackInfos = set?.tracks.map((track) => {
            const info = { ...track };
            if (origin) {
                info.origin = origin;
            }
            return info;
        }) || [];
        return trackInfos;
    }
}
exports.default = SetViewHandler;
//# sourceMappingURL=SetViewHandler.js.map