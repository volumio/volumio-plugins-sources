'use strict';

const libQ = require('kew');
const bcfetch = require('bandcamp-fetch');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const BaseModel = require(__dirname + '/base');
const Band = require(bandcampPluginLibRoot + '/core/entities/band.js');
const Artist = require(bandcampPluginLibRoot + '/core/entities/artist.js');
const Album = require(bandcampPluginLibRoot + '/core/entities/album.js');
const Track = require(bandcampPluginLibRoot + '/core/entities/track.js');

class FanModel extends BaseModel {

    getInfo(username) {
        let self = this;
        return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('fanInfo', {username}), () => {
            return bcfetch.limiter.getFanInfo(username, {
                imageFormat: self.getArtistImageFormat()
            });
        });
    }

    getCollection(options) {
        return this._getItemsByType(options, 'collection');
    }

    getWishlist(options) {
        return this._getItemsByType(options, 'wishlist');
    }

    getFollowingArtistsAndLabels(options) {
        return this._getItemsByType(options, 'followingArtistsAndLabels');
    }

    getFollowingGenres(options) {
        return this._getItemsByType(options, 'followingGenres');
    }

    _getItemsByType(options, itemType) {
        if (options.username) {
            return this.getItems({...options, _itemType: itemType});
        }
        return libQ.resolve([]);
    }

    getFetchPromise(options) {
        let self = this;
        let continuationToken = options.pageToken ? JSON.parse(options.pageToken) : null;
        let cacheKeyParams = {};
        cacheKeyParams.username = options.username;
        if (continuationToken) {
            cacheKeyParams.continuationToken = JSON.stringify(continuationToken);
        }
        switch(options._itemType) {
            case 'collection':
                return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('fanCollection', cacheKeyParams), () => {
                    return bcfetch.limiter.getFanCollection(continuationToken || options.username, {
                        imageFormat: self.getAlbumImageFormat()
                    });
                });
            case 'wishlist':
                return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('fanWishlist', cacheKeyParams), () => {
                    return bcfetch.limiter.getFanWishlist(continuationToken || options.username, {
                        imageFormat: self.getAlbumImageFormat()
                    });
                });
            case 'followingArtistsAndLabels':
                return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('fanFollowingArtistsAndLabels', cacheKeyParams), () => {
                    return bcfetch.limiter.getFanFollowingArtistsAndLabels(continuationToken || options.username, {
                        imageFormat: self.getArtistImageFormat()
                    });
                });
            case 'followingGenres':
                return bandcamp.getCache().cacheOrPromise(self.getCacheKeyForFetch('fanFollowingGenres', cacheKeyParams), () => {
                    return bcfetch.limiter.getFanFollowingGenres(continuationToken || options.username, {
                        imageFormat: self.getAlbumImageFormat()
                    });
                });
            default:
                return Promise.resolve({items: []});
        }
    }

    getItemsFromFetchResult(result, options) {
        return result.items.slice(0);
    }

    getNextPageTokenFromFetchResult(result, options) {
        return result.continuationToken ? JSON.stringify(result.continuationToken) : null;
    }

    convertToEntity(item, options) {
        switch(options._itemType) {
            case 'collection':
            case 'wishlist':
                if (item.type === 'album') {
                    let artist = item.artist || {};
                    return new Album(item.url, item.name, item.imageUrl, new Artist(artist.url, artist.name));
                }
                else if (item.type === 'track') {
                    let featuredTrack = item.featuredTrack || {};
                    let artist = item.artist || {};
                    return new Track(item.url, item.name, featuredTrack.duration, item.imageUrl, featuredTrack.streamUrl, new Artist(artist.url, artist.name), null);
                }
                else {
                    return null;
                }
            case 'followingArtistsAndLabels':
                return new Band(undefined, item.url, item.name, item.imageUrl, item.location);
            case 'followingGenres':
                return item;
            default:
                return null;
        }
    }

}

module.exports = FanModel;