"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RootViewHandler_instances, _RootViewHandler_getMe, _RootViewHandler_getTopFeaturedTracks, _RootViewHandler_getMixedSelections, _RootViewHandler_getListFromSelection;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class RootViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _RootViewHandler_instances.add(this);
    }
    async browse() {
        const fetches = [
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getMe).call(this),
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getTopFeaturedTracks).call(this),
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getMixedSelections).call(this)
        ];
        const fetchResults = await Promise.all(fetches);
        const lists = fetchResults.reduce((result, list) => {
            result.push(...list);
            return result;
        }, []);
        return {
            navigation: {
                prev: { uri: '/' },
                lists
            }
        };
    }
}
exports.default = RootViewHandler;
_RootViewHandler_instances = new WeakSet(), _RootViewHandler_getMe = async function _RootViewHandler_getMe() {
    let myProfile;
    try {
        myProfile = await this.getModel(model_1.ModelType.Me).getMyProfile();
    }
    catch (error) {
        SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getErrorMessage('', error, false));
        return [];
    }
    if (myProfile?.id) {
        const historyView = {
            name: 'history'
        };
        const historyItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_HISTORY'),
            icon: 'fa fa-history',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(historyView)}`
        };
        const trackView = {
            name: 'track',
            myLikes: '1'
        };
        const likesItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIKES'),
            icon: 'fa fa-heart',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(trackView)}`
        };
        const libraryView = {
            name: 'library',
            type: 'playlist'
        };
        const libraryPlaylistsItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_PLAYLISTS'),
            icon: 'fa fa-list',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(libraryView)}`
        };
        libraryView.type = 'album';
        const libraryAlbumsItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_ALBUMS'),
            icon: 'fa fa-music',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(libraryView)}`
        };
        libraryView.type = 'station';
        const libraryStationsItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_STATIONS'),
            icon: 'fa fa-microphone',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(libraryView)}`
        };
        const userView = {
            name: 'users',
            myFollowing: '1'
        };
        const followingItem = {
            service: 'soundcloud',
            type: 'item-no-menu',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_FOLLOWING'),
            icon: 'fa fa-users',
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`
        };
        const meName = myProfile.firstName || myProfile.lastName || myProfile.username;
        const list = {
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_WELCOME', meName),
            items: [historyItem, likesItem, libraryPlaylistsItem, libraryAlbumsItem, libraryStationsItem, followingItem],
            availableListViews: ['grid', 'list']
        };
        if (ViewHelper_1.default.supportsEnhancedTitles()) {
            list.title = `
          <div style="display: flex; flex-direction: column; height: 48px; padding: 1px 0;">
            <div style="flex-grow: 1;">${list.title}</div>
            <div><a target="_blank" style="color: #50b37d; font-size: 14px;" href="https://soundcloud.com/${myProfile.username}">${SoundCloudContext_1.default.getI18n('SOUNDCLOUD_VIEW_MY_PAGE')}</a></div>
          </div>`;
            if (myProfile.thumbnail) {
                list.title = `<img src="${myProfile.thumbnail}" style="border-radius: 50%; width: 48px; height: 48px; margin-right: 12px;" /> ${list.title}`;
            }
            list.title = `
          <div style="width: 100%; padding-bottom: 12px; border-bottom: 1px solid; display: flex; align-items: center;">
              ${list.title}
          </div>
        `;
        }
        return [list];
    }
    return [];
}, _RootViewHandler_getTopFeaturedTracks = async function _RootViewHandler_getTopFeaturedTracks() {
    try {
        const trackView = {
            name: 'tracks',
            topFeatured: '1',
            inSection: '1',
            title: SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_TOP_FEATURED_TRACKS')
        };
        const tracksUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(trackView, true)}`;
        const page = await ViewHandlerFactory_1.default.getHandler(tracksUri).browse();
        const list = page.navigation?.lists?.[0];
        if (list && list.items.length > 0) {
            if (ViewHelper_1.default.supportsEnhancedTitles()) {
                list.title = `
          <div style="width: 100%;">
              <div style="padding-bottom: 8px; border-bottom: 1px solid;">
                  ${list.title}
              </div>
          </div>`;
            }
            return [list];
        }
        return [];
    }
    catch (error) {
        SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('[soundcloud] Failed to get top featured tracks in root view:', error, true));
        return [];
    }
}, _RootViewHandler_getMixedSelections = async function _RootViewHandler_getMixedSelections() {
    try {
        const selections = await this.getModel(model_1.ModelType.Selection).getSelections({ mixed: true });
        const lists = selections.items.reduce((result, selection, index) => {
            if (selection.items.length > 0) {
                result.push(__classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getListFromSelection).call(this, selection, index));
            }
            return result;
        }, []);
        return lists;
    }
    catch (error) {
        SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('[soundcloud] Failed to get selections in root view:', error, true));
        return [];
    }
}, _RootViewHandler_getListFromSelection = function _RootViewHandler_getListFromSelection(selection, index) {
    const limit = SoundCloudContext_1.default.getConfigValue('itemsPerSection');
    const slice = selection.items.slice(0, limit);
    const renderer = this.getRenderer(renderers_1.RendererType.Playlist);
    const listItems = slice.reduce((result, item) => {
        const rendered = renderer.renderToListItem(item);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    if (selection.id && limit < selection.items.length) {
        const nextPageRef = this.constructPageRef(limit.toString(), 0);
        if (nextPageRef) {
            const selectionView = {
                name: 'selections',
                selectionId: selection.id,
                pageRef: nextPageRef
            };
            const nextUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(selectionView)}`;
            listItems.push(this.constructNextPageItem(nextUri));
        }
    }
    let listTitle;
    if (selection.title) {
        if (!ViewHelper_1.default.supportsEnhancedTitles()) {
            listTitle = selection.title;
        }
        else if (index === 0) {
            listTitle = `
              <div style="width: 100%;">
                  <div style="padding-bottom: 8px; border-bottom: 1px solid; margin-bottom: 24px;">
                      ${SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRENDING_PLAYLISTS')}
                  </div>
                  <span style="font-size: 16px; color: #bdbdbd;">${selection.title}</span>
              </div>`;
        }
        else {
            listTitle = `<span style="font-size: 16px; color: #bdbdbd;">${selection.title}</span>`;
        }
    }
    else {
        listTitle = SoundCloudContext_1.default.getI18n('SOUNDCLOUD_TRENDING_PLAYLISTS');
    }
    return {
        title: listTitle,
        availableListViews: ['list', 'grid'],
        items: listItems
    };
};
//# sourceMappingURL=RootViewHandler.js.map