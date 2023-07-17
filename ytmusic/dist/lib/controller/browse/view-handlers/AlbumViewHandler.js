"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumViewHandler_albumArtist;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const model_1 = require("../../../model");
const Endpoint_1 = require("../../../types/Endpoint");
const MusicFolderViewHandler_1 = __importDefault(require("./MusicFolderViewHandler"));
const renderers_1 = require("./renderers");
class AlbumViewHandler extends MusicFolderViewHandler_1.default {
    constructor() {
        super(...arguments);
        _AlbumViewHandler_albumArtist.set(this, void 0);
    }
    async browse() {
        const page = await super.browse();
        const { channelId, name: artistName } = __classPrivateFieldGet(this, _AlbumViewHandler_albumArtist, "f") || {};
        if (channelId && artistName && page.navigation?.lists) {
            const lastView = this.previousViews[this.previousViews.length - 1];
            const isComingFromSameArtistView = (lastView?.endpoint?.payload?.browseId === channelId);
            if (!isComingFromSameArtistView) {
                const endpointLink = {
                    type: 'endpointLink',
                    title: YTMusicContext_1.default.getI18n('YTMUSIC_MORE_FROM', artistName),
                    endpoint: {
                        type: Endpoint_1.EndpointType.Browse,
                        payload: {
                            browseId: channelId
                        }
                    }
                };
                const rendered = this.getRenderer(renderers_1.RendererType.EndpointLink).renderToListItem(endpointLink);
                if (rendered) {
                    page.navigation.lists.unshift({
                        availableListViews: ['list'],
                        items: [rendered]
                    });
                }
            }
        }
        return page;
    }
    async modelGetContents(endpoint) {
        const model = this.getModel(model_1.ModelType.Endpoint);
        const contents = await model.getContents(endpoint);
        if (contents?.type === 'page' && contents.header?.type === 'album') {
            __classPrivateFieldSet(this, _AlbumViewHandler_albumArtist, contents.header.artist, "f");
        }
        return contents;
    }
    renderToListItem(data, contents) {
        if (data.type === 'song' || data.type === 'video') {
            // Data possibly lacks album / artist / thumbnail info. Complete it by taking missing info from `contents.header`.
            if (contents.header?.type === 'album') {
                const albumHeader = contents.header;
                const albumId = albumHeader.endpoint?.payload.playlistId;
                const dataAlbumId = data.endpoint.payload.playlistId;
                if (albumId === dataAlbumId) {
                    const filledData = { ...data };
                    if (!filledData.album) {
                        filledData.album = {
                            title: albumHeader.title
                        };
                    }
                    if (!filledData.artists && albumHeader.artist) {
                        filledData.artists = [albumHeader.artist];
                        filledData.artistText = albumHeader.artist.name;
                    }
                    if (!filledData.thumbnail) {
                        filledData.thumbnail = albumHeader.thumbnail;
                    }
                    const rendered = this.getRenderer(renderers_1.RendererType.MusicItem).renderToListItem(filledData);
                    if (rendered) {
                        // Show track number only
                        rendered.albumart = null;
                    }
                    return rendered;
                }
            }
        }
        return super.renderToListItem(data, contents);
    }
}
exports.default = AlbumViewHandler;
_AlbumViewHandler_albumArtist = new WeakMap();
//# sourceMappingURL=AlbumViewHandler.js.map