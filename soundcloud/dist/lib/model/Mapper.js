"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Mapper_getThumbnail;
Object.defineProperty(exports, "__esModule", { value: true });
const soundcloud_fetch_1 = require("soundcloud-fetch");
class Mapper {
    static async mapUser(data) {
        const { id, names, location, permalink } = data;
        let locationFull = '';
        if (location?.city) {
            locationFull = location.city;
            if (location.country) {
                locationFull += `, ${location.country}`;
            }
        }
        const result = {
            id,
            username: names?.username,
            firstName: names.first,
            lastName: names.last,
            fullName: names?.full,
            thumbnail: await __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data),
            permalink: permalink?.full,
            location: locationFull
        };
        return result;
    }
    static async mapPlaylist(data) {
        const { permalink, user, trackCount } = data;
        let title, description;
        let type;
        if (data instanceof soundcloud_fetch_1.SystemPlaylist) {
            title = data.texts?.title?.full;
            description = data.texts?.description?.full;
            type = 'system-playlist';
        }
        else {
            title = data.texts?.title;
            description = data.texts?.description;
            type = 'playlist';
        }
        const result = {
            type,
            title,
            description,
            thumbnail: await __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data),
            permalink: permalink?.full,
            user: user ? await this.mapUser(user) : null,
            tracks: [],
            trackCount: trackCount,
            isPublic: data.isPublic
        };
        if (result.type === 'system-playlist' && data instanceof soundcloud_fetch_1.SystemPlaylist) {
            result.id = data.id;
            result.urn = data.apiInfo.urn;
        }
        else if (result.type === 'playlist' && data instanceof soundcloud_fetch_1.Playlist) {
            result.id = data.id;
        }
        return result;
    }
    static async mapTrack(data) {
        const { id, texts, publisher, mediaInfo, user } = data;
        const album = publisher?.albumTitle || publisher?.releaseTitle || null;
        const playableState = data.isBlocked ? 'blocked' :
            data.isSnipped ? 'snipped' :
                'allowed';
        const transcodings = mediaInfo?.transcodings?.map((t) => ({
            url: t.url,
            protocol: t.protocol,
            mimeType: t.mimeType,
            quality: t.quality
        })) || [];
        const result = {
            type: 'track',
            id,
            urn: data.apiInfo.urn,
            title: texts?.title,
            album,
            thumbnail: await __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data),
            playableState,
            duration: data.durations.playback,
            transcodings,
            user: user ? await this.mapUser(user) : null
        };
        return result;
    }
    static async mapLibraryItem(data) {
        const wrappedItem = data.item;
        let mappedSet;
        if (wrappedItem instanceof soundcloud_fetch_1.Album) {
            mappedSet = await this.mapAlbum(wrappedItem);
        }
        else if (wrappedItem instanceof soundcloud_fetch_1.Playlist || wrappedItem instanceof soundcloud_fetch_1.SystemPlaylist) {
            mappedSet = await this.mapPlaylist(wrappedItem);
        }
        else {
            return null;
        }
        mappedSet.isLiked = data.itemType === 'AlbumLike' || data.itemType === 'PlaylistLike' || data.itemType === 'SystemPlaylistLike';
        return mappedSet;
    }
    static async mapAlbum(data) {
        const { id, permalink, user, trackCount } = data;
        const title = data.texts?.title;
        const description = data.texts?.description;
        const result = {
            id,
            type: 'album',
            title,
            description,
            thumbnail: await __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data),
            permalink: permalink?.full,
            user: user ? await this.mapUser(user) : null,
            tracks: [],
            trackCount,
            isPublic: data.isPublic
        };
        return result;
    }
    static async mapSelection(data) {
        const items = await Promise.all(data.items.reduce((result, item) => {
            if (item instanceof soundcloud_fetch_1.Playlist || item instanceof soundcloud_fetch_1.SystemPlaylist) {
                result.push(this.mapPlaylist(item));
            }
            return result;
        }, []));
        const result = {
            type: 'selection',
            id: data.id,
            title: data.title,
            items
        };
        return result;
    }
}
exports.default = Mapper;
_a = Mapper, _Mapper_getThumbnail = async function _Mapper_getThumbnail(data) {
    let artwork;
    if (data instanceof soundcloud_fetch_1.User) {
        artwork = data.avatar;
    }
    else if (data instanceof soundcloud_fetch_1.SystemPlaylist) {
        artwork = data.artwork?.original || data.artwork?.calculated;
    }
    else if (data instanceof soundcloud_fetch_1.Playlist || data instanceof soundcloud_fetch_1.Track) {
        artwork = data.artwork;
    }
    else {
        artwork = null;
    }
    if (artwork) {
        return artwork.t500x500 || artwork.default;
    }
    if (data instanceof soundcloud_fetch_1.Playlist || data instanceof soundcloud_fetch_1.SystemPlaylist || data instanceof soundcloud_fetch_1.Album) {
        const tracks = await data.getTracks();
        if (tracks.length > 0) {
            return __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, tracks[0]);
        }
        if (data.user) {
            return __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data.user);
        }
    }
    if (data instanceof soundcloud_fetch_1.Track && data.user) {
        return __classPrivateFieldGet(this, _a, "m", _Mapper_getThumbnail).call(this, data.user);
    }
    return null;
};
//# sourceMappingURL=Mapper.js.map