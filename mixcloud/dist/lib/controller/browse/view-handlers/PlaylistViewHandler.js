"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlaylistViewHandler_instances, _PlaylistViewHandler_browseUserPlaylists, _PlaylistViewHandler_getPlaylistList;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
class PlaylistViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _PlaylistViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.username) {
            return __classPrivateFieldGet(this, _PlaylistViewHandler_instances, "m", _PlaylistViewHandler_browseUserPlaylists).call(this, view.username);
        }
        throw Error('Operation not supported');
    }
    async getStreamableEntitiesOnExplode() {
        const view = this.currentView;
        if (!view.playlistId) {
            throw Error('Operation not supported');
        }
        const cloudcastParams = {
            playlistId: view.playlistId,
            limit: MixcloudContext_1.default.getConfigValue('itemsPerPage')
        };
        const cloudcasts = await this.getModel(model_1.ModelType.Cloudcast).getCloudcasts(cloudcastParams);
        return cloudcasts.items;
    }
}
_PlaylistViewHandler_instances = new WeakSet(), _PlaylistViewHandler_browseUserPlaylists = async function _PlaylistViewHandler_browseUserPlaylists(username) {
    const playlistParams = {
        username
    };
    const [user, playlists] = await Promise.all([
        this.getModel(model_1.ModelType.User).getUser(username),
        this.getModel(model_1.ModelType.Playlist).getPlaylists(playlistParams)
    ]);
    const lists = [];
    if (playlists.items.length > 0) {
        lists.push(__classPrivateFieldGet(this, _PlaylistViewHandler_instances, "m", _PlaylistViewHandler_getPlaylistList).call(this, user, playlists));
        let listTitle = MixcloudContext_1.default.getI18n('MIXCLOUD_PLAYLISTS');
        if (!this.currentView.inSection) {
            const backLink = this.constructPrevViewLink(MixcloudContext_1.default.getI18n('MIXCLOUD_BACK_LINK_USER'));
            listTitle = UIHelper_1.default.constructListTitleWithLink(listTitle, backLink, true);
        }
        lists[0].title = listTitle;
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: user ? this.getRenderer(renderers_1.RendererType.User).renderToHeader(user) : undefined,
            lists
        }
    };
}, _PlaylistViewHandler_getPlaylistList = function _PlaylistViewHandler_getPlaylistList(user, playlists) {
    const renderer = this.getRenderer(renderers_1.RendererType.Playlist);
    const items = playlists.items.reduce((result, playlist) => {
        const rendered = renderer.renderToListItem({
            ...playlist,
            owner: user || undefined
        });
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(playlists.nextPageToken, playlists.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        items.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items
    };
};
exports.default = PlaylistViewHandler;
//# sourceMappingURL=PlaylistViewHandler.js.map