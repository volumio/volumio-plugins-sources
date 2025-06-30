"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SearchController_instances, _SearchController_doSearch;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../SoundCloudContext"));
const ViewHandlerFactory_1 = __importDefault(require("../browse/view-handlers/ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
class SearchController {
    constructor() {
        _SearchController_instances.add(this);
    }
    async search(query) {
        const safeQuery = query.value.replace(/"/g, '\\"');
        const userView = {
            name: 'users',
            search: safeQuery,
            combinedSearch: '1',
            title: this.addIcon(SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_USERS_MATCHING', query.value))
        };
        const searchUsersUri = `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(userView, true)}`;
        const albumView = {
            name: 'albums',
            search: safeQuery,
            combinedSearch: '1',
            title: this.addIcon(SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS_MATCHING', query.value))
        };
        const searchAlbumsUri = `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(albumView, true)}`;
        const playlistView = {
            name: 'playlists',
            search: safeQuery,
            combinedSearch: '1',
            title: this.addIcon(SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS_MATCHING', query.value))
        };
        const searchPlaylistsUri = `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(playlistView, true)}`;
        const trackView = {
            name: 'tracks',
            search: safeQuery,
            combinedSearch: '1',
            title: this.addIcon(SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS_MATCHING', query.value))
        };
        const searchTracksUri = `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(trackView, true)}`;
        const searches = [
            __classPrivateFieldGet(this, _SearchController_instances, "m", _SearchController_doSearch).call(this, searchUsersUri, 'users'),
            __classPrivateFieldGet(this, _SearchController_instances, "m", _SearchController_doSearch).call(this, searchAlbumsUri, 'albums'),
            __classPrivateFieldGet(this, _SearchController_instances, "m", _SearchController_doSearch).call(this, searchPlaylistsUri, 'playlists'),
            __classPrivateFieldGet(this, _SearchController_instances, "m", _SearchController_doSearch).call(this, searchTracksUri, 'tracks')
        ];
        const searchResults = await Promise.all(searches);
        const lists = searchResults.reduce((result, sr) => {
            if (!sr) {
                return result;
            }
            const { list, type } = sr;
            switch (type) {
                case 'users':
                    list.title = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_USERS');
                    break;
                case 'albums':
                    list.title = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_ALBUMS');
                    break;
                case 'playlists':
                    list.title = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_PLAYLISTS');
                    break;
                case 'tracks':
                    list.title = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_TRACKS');
                    break;
                default:
                    list.title = 'SoundCloud';
            }
            list.title = this.addIcon(list.title);
            result.push(list);
            return result;
        }, []);
        return lists;
    }
    addIcon(s) {
        if (!ViewHelper_1.default.supportsEnhancedTitles()) {
            return s;
        }
        const icon = `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/soundcloud/dist/assets/images/soundcloud.svg')}" style="width: 23px; height: 23px; margin-right: 8px; margin-top: -3px;" />`;
        return icon + s;
    }
}
exports.default = SearchController;
_SearchController_instances = new WeakSet(), _SearchController_doSearch = async function _SearchController_doSearch(uri, type) {
    try {
        const page = await ViewHandlerFactory_1.default.getHandler(uri).browse();
        const list = page.navigation?.lists?.[0];
        if (list && list.items.length > 0) {
            return {
                list,
                type
            };
        }
        return null;
    }
    catch (error) {
        SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('[soundcloud] Search error:', error, true));
        return null;
    }
};
//# sourceMappingURL=SearchController.js.map