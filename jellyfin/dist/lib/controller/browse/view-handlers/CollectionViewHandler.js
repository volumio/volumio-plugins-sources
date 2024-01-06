"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CollectionViewHandler_instances, _CollectionViewHandler_getList;
Object.defineProperty(exports, "__esModule", { value: true });
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const model_1 = require("../../../model");
const entities_1 = require("../../../entities");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
class CollectionViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _CollectionViewHandler_instances.add(this);
    }
    async browse() {
        const baseUri = this.uri;
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const collectionId = view.parentId;
        const listPromises = [];
        if (view.itemType) {
            listPromises.push(__classPrivateFieldGet(this, _CollectionViewHandler_instances, "m", _CollectionViewHandler_getList).call(this, collectionId, view.itemType, baseUri));
        }
        else {
            listPromises.push(__classPrivateFieldGet(this, _CollectionViewHandler_instances, "m", _CollectionViewHandler_getList).call(this, collectionId, 'album', baseUri, true), __classPrivateFieldGet(this, _CollectionViewHandler_instances, "m", _CollectionViewHandler_getList).call(this, collectionId, 'artist', baseUri, true), __classPrivateFieldGet(this, _CollectionViewHandler_instances, "m", _CollectionViewHandler_getList).call(this, collectionId, 'playlist', baseUri, true), __classPrivateFieldGet(this, _CollectionViewHandler_instances, "m", _CollectionViewHandler_getList).call(this, collectionId, 'song', baseUri, true));
        }
        const lists = await Promise.all(listPromises);
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists: lists.filter((list) => list?.items.length)
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
}
exports.default = CollectionViewHandler;
_CollectionViewHandler_instances = new WeakSet(), _CollectionViewHandler_getList = async function _CollectionViewHandler_getList(collectionId, itemType, baseUri, inSection = false) {
    let entityType;
    switch (itemType) {
        case 'album':
            entityType = entities_1.EntityType.Album;
            break;
        case 'artist':
            entityType = entities_1.EntityType.Artist;
            break;
        case 'playlist':
            entityType = entities_1.EntityType.Playlist;
            break;
        case 'song':
        default:
            entityType = entities_1.EntityType.Song;
            break;
    }
    const modelQueryParams = {
        ...this.getModelQueryParams(),
        itemType: entityType
    };
    if (inSection) {
        modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('collectionInSectionItems');
    }
    let moreUri;
    if (inSection) {
        const collectionView = {
            name: 'collection',
            parentId: collectionId,
            itemType
        };
        moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(collectionView)}`;
    }
    else {
        moreUri = this.constructNextUri();
    }
    const title = JellyfinContext_1.default.getI18n(`JELLYFIN_${itemType.toUpperCase()}S`);
    const model = this.getModel(model_1.ModelType.Collection);
    const collectionItems = await model.getCollectionItems(modelQueryParams);
    const listItems = collectionItems.items.map((item) => {
        switch (item.type) {
            case entities_1.EntityType.Album:
                return this.getRenderer(entities_1.EntityType.Album).renderToListItem(item);
            case entities_1.EntityType.Song:
                return this.getRenderer(entities_1.EntityType.Song).renderToListItem(item);
            case entities_1.EntityType.Artist:
                return this.getRenderer(entities_1.EntityType.Artist).renderToListItem(item, { noParent: true });
            case entities_1.EntityType.Playlist:
                return this.getRenderer(entities_1.EntityType.Playlist).renderToListItem(item);
            default:
                return null;
        }
    }).filter((item) => item);
    if (collectionItems.nextStartIndex) {
        listItems.push(inSection ? this.constructNextPageItem(moreUri) : this.constructMoreItem(moreUri));
    }
    return {
        title,
        availableListViews: ['list', 'grid'],
        items: listItems
    };
};
//# sourceMappingURL=CollectionViewHandler.js.map