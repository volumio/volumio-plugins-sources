"use strict";
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
var _AlbumArtHandler_instances, _AlbumArtHandler_albumArtPlugin, _AlbumArtHandler_getAlbumArtWithPlugin;
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../entities");
const UserView_1 = require("../entities/UserView");
const JellyfinContext_1 = __importDefault(require("../JellyfinContext"));
class AlbumArtHandler {
    constructor() {
        _AlbumArtHandler_instances.add(this);
        _AlbumArtHandler_albumArtPlugin.set(this, void 0);
        __classPrivateFieldSet(this, _AlbumArtHandler_albumArtPlugin, JellyfinContext_1.default.getAlbumArtPlugin(), "f");
    }
    getAlbumArtUri(item) {
        if (item.thumbnail) {
            return item.thumbnail;
        }
        else if (item.type === entities_1.EntityType.Song) {
            const song = item;
            if (song.album?.thumbnail) {
                return song.album.thumbnail;
            }
        }
        const baseImgPath = 'music_service/jellyfin/dist/assets/images/';
        let url;
        let defaultImg;
        // UserView - playlists
        if (item.type === entities_1.EntityType.UserView && item.userViewType === UserView_1.UserViewType.Playlists) {
            defaultImg = 'playlist.png';
        }
        // Library
        else if (item.type === entities_1.EntityType.UserView && item.userViewType === UserView_1.UserViewType.Library) {
            defaultImg = 'album.png';
        }
        // Folder
        else if ((item.type === entities_1.EntityType.UserView && item.userViewType === UserView_1.UserViewType.Folders) ||
            item.type === entities_1.EntityType.Folder || item.type === entities_1.EntityType.CollectionFolder) {
            defaultImg = 'folder.png';
        }
        // Album - fetch from web if possible (using AlbumArt plugin)
        else if (item.type === entities_1.EntityType.Album) {
            const album = item;
            if (album.albumArtist) {
                url = __classPrivateFieldGet(this, _AlbumArtHandler_instances, "m", _AlbumArtHandler_getAlbumArtWithPlugin).call(this, {
                    album: album.name,
                    artist: album.albumArtist
                });
            }
            defaultImg = 'album.png';
        }
        // Artist - fetch from web if possible (using AlbumArt plugin)
        else if (item.type === entities_1.EntityType.Artist || item.type === entities_1.EntityType.AlbumArtist) {
            url = __classPrivateFieldGet(this, _AlbumArtHandler_instances, "m", _AlbumArtHandler_getAlbumArtWithPlugin).call(this, {
                artist: item.name
            });
            defaultImg = 'avatar.png';
        }
        // Playlist
        else if (item.type === entities_1.EntityType.Playlist) {
            defaultImg = 'playlist.png';
        }
        // Genre
        else if (item.type === entities_1.EntityType.Genre) {
            defaultImg = 'genre.png';
        }
        // Song - get art of album
        else if (item.type === entities_1.EntityType.Song) {
            const song = item;
            if (song.album?.name && song.artists?.[0]?.name) {
                url = __classPrivateFieldGet(this, _AlbumArtHandler_instances, "m", _AlbumArtHandler_getAlbumArtWithPlugin).call(this, {
                    album: song.album.name,
                    artist: song.artists[0].name
                });
            }
            defaultImg = 'song.png';
        }
        else {
            url = '/albumart';
        }
        if (defaultImg) {
            url = (url ? `${url}&` : '/albumart?');
            url += `sourceicon=${encodeURIComponent(baseImgPath + defaultImg)}`;
        }
        return url;
    }
}
exports.default = AlbumArtHandler;
_AlbumArtHandler_albumArtPlugin = new WeakMap(), _AlbumArtHandler_instances = new WeakSet(), _AlbumArtHandler_getAlbumArtWithPlugin = function _AlbumArtHandler_getAlbumArtWithPlugin(data) {
    return __classPrivateFieldGet(this, _AlbumArtHandler_albumArtPlugin, "f").getAlbumArt(data);
};
//# sourceMappingURL=AlbumArtHandler.js.map