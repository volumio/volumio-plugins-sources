"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _UserViewViewHandler_instances, _UserViewViewHandler_getLatestLibraryAlbumList;
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const UserView_1 = require("../../../entities/UserView");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class UserViewViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _UserViewViewHandler_instances.add(this);
    }
    async browse() {
        const prevUri = this.constructPrevUri();
        const lists = [];
        const model = this.getModel(model_1.ModelType.UserView);
        const renderer = this.getRenderer(entities_1.EntityType.UserView);
        const userViews = await model.getUserViews();
        const myMediaItems = userViews.items.map((userView) => renderer.renderToListItem(userView)).filter((item) => item);
        lists.push({
            availableListViews: ['list', 'grid'],
            title: JellyfinContext_1.default.getI18n('JELLYFIN_MY_MEDIA'),
            items: myMediaItems
        });
        if (JellyfinContext_1.default.getConfigValue('showLatestMusicSection')) {
            const libraries = userViews.items.filter((userView) => userView.userViewType === UserView_1.UserViewType.Library);
            const latestLibraryAlbumLists = await Promise.all(libraries.map((library) => __classPrivateFieldGet(this, _UserViewViewHandler_instances, "m", _UserViewViewHandler_getLatestLibraryAlbumList).call(this, library)));
            latestLibraryAlbumLists.forEach((list) => {
                if (list.items.length > 0) {
                    lists.push(list);
                }
            });
        }
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
}
exports.default = UserViewViewHandler;
_UserViewViewHandler_instances = new WeakSet(), _UserViewViewHandler_getLatestLibraryAlbumList = async function _UserViewViewHandler_getLatestLibraryAlbumList(library) {
    const albumView = {
        name: 'albums',
        parentId: library.id,
        sortBy: 'DateCreated,SortName',
        sortOrder: 'Descending,Ascending',
        fixedView: 'latest'
    };
    const moreUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
    const model = this.getModel(model_1.ModelType.Album);
    const renderer = this.getRenderer(entities_1.EntityType.Album);
    const modelQueryParams = this.getModelQueryParams({
        parentId: library.id,
        sortBy: 'DateCreated,SortName',
        sortOrder: 'Descending,Ascending',
        limit: JellyfinContext_1.default.getConfigValue('latestMusicSectionItems')
    });
    const albums = await model.getAlbums(modelQueryParams);
    const listItems = albums.items.map((album) => renderer.renderToListItem(album)).filter((item) => item);
    if (albums.nextStartIndex) {
        listItems.push(this.constructNextPageItem(moreUri, `<span style='color: #7a848e;'>${JellyfinContext_1.default.getI18n('JELLYFIN_VIEW_MORE')}</span>`));
    }
    return {
        title: JellyfinContext_1.default.getI18n('JELLYFIN_LATEST_IN', library.name),
        availableListViews: ['list', 'grid'],
        items: listItems
    };
};
//# sourceMappingURL=UserViewViewHandler.js.map