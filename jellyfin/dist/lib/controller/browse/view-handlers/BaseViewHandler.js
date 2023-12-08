"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BaseViewHandler_uri, _BaseViewHandler_currentView, _BaseViewHandler_previousViews, _BaseViewHandler_connection, _BaseViewHandler_models, _BaseViewHandler_renderers, _BaseViewHandler_albumArtHandler;
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importStar(require("../../../model"));
const renderer_1 = __importDefault(require("./renderer"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const util_1 = require("../../../util");
const AlbumArtHandler_1 = __importDefault(require("../../../util/AlbumArtHandler"));
const UI_1 = __importDefault(require("../../../util/UI"));
class BaseViewHandler {
    constructor(uri, currentView, previousViews, connection) {
        _BaseViewHandler_uri.set(this, void 0);
        _BaseViewHandler_currentView.set(this, void 0);
        _BaseViewHandler_previousViews.set(this, void 0);
        _BaseViewHandler_connection.set(this, void 0);
        _BaseViewHandler_models.set(this, void 0);
        _BaseViewHandler_renderers.set(this, void 0);
        _BaseViewHandler_albumArtHandler.set(this, void 0);
        __classPrivateFieldSet(this, _BaseViewHandler_uri, uri, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_currentView, currentView, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_previousViews, previousViews, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_connection, connection, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_models, {}, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_renderers, {}, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_albumArtHandler, new AlbumArtHandler_1.default(), "f");
    }
    async browse() {
        return {};
    }
    explode() {
        throw Error('Operation not supported');
    }
    get uri() {
        return __classPrivateFieldGet(this, _BaseViewHandler_uri, "f");
    }
    get currentView() {
        return __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f");
    }
    get previousViews() {
        return __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f");
    }
    getModel(type) {
        if (!__classPrivateFieldGet(this, _BaseViewHandler_connection, "f")) {
            throw Error('No server connection');
        }
        if (!__classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type]) {
            __classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type] = model_1.default.getInstance(type, __classPrivateFieldGet(this, _BaseViewHandler_connection, "f"));
        }
        return __classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type];
    }
    getRenderer(type) {
        if (__classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type] === undefined) {
            try {
                __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type] = renderer_1.default.getInstance(type, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"), __classPrivateFieldGet(this, _BaseViewHandler_albumArtHandler, "f"));
            }
            catch (error) {
                __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type] = null;
            }
        }
        return __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type];
    }
    constructPrevUri() {
        const segments = [];
        __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").forEach((view) => {
            segments.push(ViewHelper_1.default.constructUriSegmentFromView(view));
        });
        if ((__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").startIndex || 0) > 0) {
            const delta = __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").limit || JellyfinContext_1.default.getConfigValue('itemsPerPage');
            const startIndex = Math.max((__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").startIndex || 0) - delta, 0);
            segments.push(ViewHelper_1.default.constructUriSegmentFromView({
                ...__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"),
                startIndex
            }));
        }
        return segments.join('/');
    }
    constructNextUri(startIndex, nextView) {
        const segments = [];
        __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").forEach((view) => {
            segments.push(ViewHelper_1.default.constructUriSegmentFromView(view));
        });
        const currentView = nextView || __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f");
        if (startIndex === undefined) {
            startIndex = (currentView.startIndex || 0) + (currentView.limit || JellyfinContext_1.default.getConfigValue('itemsPerPage'));
        }
        segments.push(ViewHelper_1.default.constructUriSegmentFromView({
            ...currentView,
            startIndex
        }));
        return segments.join('/');
    }
    constructNextPageItem(nextUri, title) {
        if (!title) {
            title = `<span style='color: #7a848e;'>${JellyfinContext_1.default.getI18n('JELLYFIN_NEXT_PAGE')}</span>`;
        }
        return {
            service: 'jellyfin',
            type: 'streaming-category',
            title: title,
            uri: `${nextUri}@noExplode=1`,
            icon: 'fa fa-arrow-circle-right'
        };
    }
    constructMoreItem(moreUri, title) {
        if (!title) {
            title = `<span style='color: #7a848e;'>${JellyfinContext_1.default.getI18n('JELLYFIN_VIEW_MORE')}</span>`;
        }
        return this.constructNextPageItem(moreUri, title);
    }
    getModelQueryParams(bundle) {
        const defaults = {
            startIndex: 0,
            limit: JellyfinContext_1.default.getConfigValue('itemsPerPage'),
            sortBy: 'SortName',
            sortOrder: 'Ascending'
        };
        const props = {
            ...defaults,
            ...(bundle || this.currentView)
        };
        const params = (0, util_1.objectAssignIfExists)({}, props, [
            'startIndex',
            'limit',
            'sortBy',
            'sortOrder',
            'recursive',
            'parentId',
            'genreIds',
            'filters',
            'years',
            'nameStartsWith'
        ]);
        if (props.artistId) {
            params.artistIds = props.artistId;
        }
        if (props.albumArtistId) {
            params.albumArtistIds = props.albumArtistId;
        }
        if (props.genreId) {
            if (params.genreIds) {
                params.genreIds += `,${props.genreId}`;
            }
            else {
                params.genreIds = props.genreId;
            }
        }
        if (props.search) {
            // Safe value
            params.search = props.search.replace(/"/g, '\\"');
        }
        return params;
    }
    getAlbumArt(item) {
        return __classPrivateFieldGet(this, _BaseViewHandler_albumArtHandler, "f").getAlbumArtUri(item);
    }
    get serverConnection() {
        return __classPrivateFieldGet(this, _BaseViewHandler_connection, "f");
    }
    async setPageTitle(pageContents) {
        const supportsEnhancedTitles = UI_1.default.supportsEnhancedTitles();
        const view = __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f");
        let itemText = '';
        // If first list already has a title, use that. Otherwise, deduce from view.
        if (pageContents.lists?.[0]?.title) {
            itemText = pageContents.lists[0].title;
        }
        else if (view.fixedView) {
            let itemTextKey;
            switch (view.fixedView) {
                case 'latest':
                    itemTextKey = `LATEST_${view.name.toUpperCase()}`;
                    break;
                case 'recentlyPlayed':
                    itemTextKey = `RECENTLY_PLAYED_${view.name.toUpperCase()}`;
                    break;
                case 'frequentlyPlayed':
                    itemTextKey = `FREQUENTLY_PLAYED_${view.name.toUpperCase()}`;
                    break;
                case 'favorite':
                    itemTextKey = `FAVORITE_${view.name.toUpperCase()}`;
                    break;
                default:
                    itemTextKey = null;
            }
            itemText = itemTextKey ? JellyfinContext_1.default.getI18n(`JELLYFIN_${itemTextKey}`) : '';
        }
        else if (view.search && !view.collatedSearchResults) {
            const itemName = JellyfinContext_1.default.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
            itemText = JellyfinContext_1.default.getI18n('JELLYFIN_ITEMS_MATCHING', itemName, view.search);
        }
        else {
            itemText = JellyfinContext_1.default.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
        }
        if (view.search && !supportsEnhancedTitles && __classPrivateFieldGet(this, _BaseViewHandler_connection, "f")) {
            itemText = JellyfinContext_1.default.getI18n('JELLYFIN_SEARCH_LIST_TITLE_PLAIN', `${__classPrivateFieldGet(this, _BaseViewHandler_connection, "f").username} @ ${__classPrivateFieldGet(this, _BaseViewHandler_connection, "f").server.name}`, itemText);
        }
        if (!supportsEnhancedTitles || !__classPrivateFieldGet(this, _BaseViewHandler_connection, "f")) {
            if (pageContents.lists?.[0]) {
                pageContents.lists[0].title = itemText;
            }
            return pageContents;
        }
        // Crumb links
        // -- First is always server link
        const crumbs = [{
                uri: `jellyfin/${__classPrivateFieldGet(this, _BaseViewHandler_connection, "f").id}`,
                text: `${__classPrivateFieldGet(this, _BaseViewHandler_connection, "f").username} @ ${__classPrivateFieldGet(this, _BaseViewHandler_connection, "f").server.name}`
            }];
        // -- Subsequent links
        const allViews = [
            ...this.previousViews,
            view
        ];
        // For 'Latest Albums in {library}' section under 'My Media'
        if (view.name === 'albums' && view.parentId) {
            allViews.push({
                name: 'library',
                parentId: view.parentId
            });
        }
        const processedViews = [];
        for (let i = 2; i < allViews.length; i++) {
            const pv = allViews[i];
            if (!processedViews.includes(pv.name)) {
                if (pv.name === 'collections') {
                    const collectionsView = {
                        name: 'collections',
                        parentId: pv.parentId
                    };
                    crumbs.push({
                        uri: ViewHelper_1.default.constructUriSegmentFromView(collectionsView),
                        text: JellyfinContext_1.default.getI18n('JELLYFIN_COLLECTIONS')
                    });
                }
                else if (pv.name === 'collection' && pv.parentId) {
                    const collectionView = {
                        name: 'collection',
                        parentId: pv.parentId
                    };
                    const model = this.getModel(model_1.ModelType.Collection);
                    const collection = await model.getCollection(pv.parentId);
                    if (collection) {
                        crumbs.push({
                            uri: ViewHelper_1.default.constructUriSegmentFromView(collectionView),
                            text: collection?.name
                        });
                    }
                }
                else if (pv.name === 'playlists') {
                    const playlistView = {
                        name: 'playlists'
                    };
                    crumbs.push({
                        uri: ViewHelper_1.default.constructUriSegmentFromView(playlistView),
                        text: JellyfinContext_1.default.getI18n('JELLYFIN_PLAYLISTS')
                    });
                }
                else if (pv.name === 'library' && pv.parentId) {
                    const model = this.getModel(model_1.ModelType.UserView);
                    const userView = await model.getUserView(pv.parentId);
                    if (userView) {
                        const libraryView = {
                            name: 'library',
                            parentId: pv.parentId
                        };
                        crumbs.push({
                            uri: ViewHelper_1.default.constructUriSegmentFromView(libraryView),
                            text: userView.name
                        });
                    }
                }
                else if (pv.name === 'folder' && pv.parentId) {
                    const folderView = {
                        name: 'folder',
                        parentId: pv.parentId
                    };
                    const model = this.getModel(model_1.ModelType.Folder);
                    const folder = await model.getFolder(pv.parentId);
                    if (folder) {
                        crumbs.push({
                            uri: ViewHelper_1.default.constructUriSegmentFromView(folderView),
                            text: folder.name
                        });
                    }
                }
                else if (view.search && view.collatedSearchResults) {
                    const itemName = JellyfinContext_1.default.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
                    crumbs.push({
                        text: itemName
                    });
                }
                processedViews.push(pv.name);
            }
        }
        let prevCrumbUri;
        const crumbsWithFullUri = crumbs.map((link) => {
            const crumb = {
                text: link.text
            };
            if (link.uri) {
                crumb.uri = prevCrumbUri ? `${prevCrumbUri}/${link.uri}` : link.uri;
                prevCrumbUri = crumb.uri;
            }
            return crumb;
        });
        if ((itemText || crumbsWithFullUri.length > 0) && pageContents.lists?.[0]) {
            const crumbStringParts = crumbsWithFullUri.reduce((result, crumb, i) => {
                const style = (i > 0 && i === crumbsWithFullUri.length - 1) ? ' style="font-size: 18px;"' : '';
                result.push(`<span${style}}>${crumb.uri ? UI_1.default.createLink({ uri: crumb.uri, text: crumb.text }) : crumb.text}</span>`);
                return result;
            }, []);
            const crumbDivider = '<i class="fa fa-angle-right" style="margin: 0px 10px;"></i>';
            const byLine = (itemText && itemText !== crumbsWithFullUri[crumbsWithFullUri.length - 1].text) ?
                `<div style="margin-top: 25px;">${itemText}</div>` : '';
            pageContents.lists[0].title = `
        <div style="width: 100%;">
          <div style="display: flex; align-items: center; font-size: 14px; border-bottom: 1px dotted; border-color: #666; padding-bottom: 10px;">
            <img src="/albumart?sourceicon=${encodeURIComponent('music_service/jellyfin/dist/assets/images/jellyfin.svg')}" style="width: 18px; height: 18px; margin-right: 8px;">${crumbStringParts.join(crumbDivider)}
          </div>
          ${byLine}
        </div>`;
        }
        return pageContents;
    }
}
exports.default = BaseViewHandler;
_BaseViewHandler_uri = new WeakMap(), _BaseViewHandler_currentView = new WeakMap(), _BaseViewHandler_previousViews = new WeakMap(), _BaseViewHandler_connection = new WeakMap(), _BaseViewHandler_models = new WeakMap(), _BaseViewHandler_renderers = new WeakMap(), _BaseViewHandler_albumArtHandler = new WeakMap();
//# sourceMappingURL=BaseViewHandler.js.map