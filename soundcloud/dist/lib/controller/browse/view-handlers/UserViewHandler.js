"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _UserViewHandler_instances, _UserViewHandler_doFetch;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class UserViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _UserViewHandler_instances.add(this);
    }
    async browse() {
        const view = this.currentView;
        if (view.userId) {
            return this.browseUser(Number(view.userId));
        }
        const { pageRef, search, myFollowing, combinedSearch } = view;
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
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
        else if (myFollowing) {
            modelParams.myFollowing = true;
        }
        if (search && combinedSearch) {
            modelParams.limit = SoundCloudContext_1.default.getConfigValue('combinedSearchResults');
        }
        else {
            modelParams.limit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
        }
        const title = myFollowing ? SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_FOLLOWING') : SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_USERS');
        const result = await this.getModel(model_1.ModelType.User).getUsers(modelParams);
        return this.buildPageFromLoopFetchResult(result, {
            renderer: this.getRenderer(renderers_1.RendererType.User),
            title
        });
    }
    async browseUser(userId) {
        const albumView = {
            name: 'albums',
            userId: userId.toString(),
            inSection: '1',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS')
        };
        const albumsUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView, true)}`;
        const playlistView = {
            name: 'playlists',
            userId: userId.toString(),
            inSection: '1',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS')
        };
        const playlistsUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(playlistView, true)}`;
        const trackView = {
            name: 'tracks',
            userId: userId.toString(),
            inSection: '1',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS')
        };
        const tracksUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(trackView, true)}`;
        const fetches = [
            __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_doFetch).call(this, albumsUri),
            __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_doFetch).call(this, playlistsUri),
            __classPrivateFieldGet(this, _UserViewHandler_instances, "m", _UserViewHandler_doFetch).call(this, tracksUri)
        ];
        const subPages = await Promise.all(fetches);
        const lists = subPages.reduce((result, page) => {
            const list = page.navigation?.lists?.[0];
            if (list && list.items.length > 0) {
                result.push(list);
            }
            return result;
        }, []);
        const page = {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists
            }
        };
        try {
            const userData = await this.getModel(model_1.ModelType.User).getUser(userId);
            if (userData) {
                const header = this.getRenderer(renderers_1.RendererType.User).renderToHeader(userData);
                if (header && page.navigation) {
                    page.navigation.info = header;
                    if (userData.permalink && userData.username && lists.length > 0) {
                        const title = lists[0].title;
                        lists[0].title = this.addLinkToListTitle(title, userData.permalink, SoundCloudContext_1.default.getI18n('SOUNDCLOUD_VISIT_LINK_USER', userData.username));
                    }
                }
            }
        }
        catch (error) {
            // Do nothing
        }
        return page;
    }
    async getTracksOnExplode() {
        const { userId } = this.currentView;
        if (userId === undefined) {
            throw Error('User ID not specified');
        }
        const tracks = await this.getModel(model_1.ModelType.Track).getTracks({
            userId: Number(userId),
            limit: SoundCloudContext_1.default.getConfigValue('itemsPerPage')
        });
        return tracks.items;
    }
}
exports.default = UserViewHandler;
_UserViewHandler_instances = new WeakSet(), _UserViewHandler_doFetch = function _UserViewHandler_doFetch(uri) {
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    return handler.browse();
};
//# sourceMappingURL=UserViewHandler.js.map