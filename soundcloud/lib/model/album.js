'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseModel = require(__dirname + '/base');
const Mapper = require(__dirname + '/mapper');
const TrackHelper = require(scPluginLibRoot + '/helper/track');

class AlbumModel extends BaseModel {

    getAlbums(options) {
        if (options.search || options.userId) {
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getAlbum(albumId, options = {}) {
        let self = this;
        let defer = libQ.defer();

        let cacheKeyParams = Object.assign({}, {albumId: albumId}, options);
        sc.getCache().cacheOrPromise(self.getCacheKeyForFetch('album', cacheKeyParams), () => {
            return self.getSoundCloudClient().getAlbum(albumId);
        }).then( (info) => {
            let album = self.convertToEntity(info);
            album.tracks = [];
            if (options.loadTracks) {
                let offset = options.tracksOffset || 0;
                let limit = options.tracksLimit || false;
                info.getTracks({ offset, limit }).then( (tracks) => {
                    tracks.forEach( (trackInfo) => {
                        album.tracks.push(Mapper.mapTrack(trackInfo));
                    });
                    TrackHelper.cacheTracks(album.tracks, self.getCacheKeyForFetch.bind(self));
                    defer.resolve(album);
                }).catch( (error) => {
                    defer.reject(error);
                });
            }
            else {
                defer.resolve(album);
            }
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        let client = this.getSoundCloudClient();
        let queryParams = {
            offset: options.pageToken || 0,
            limit: this.getQueryMaxLimit()
        };
        if (options.search) {
            queryParams.type = 'album';
            let cacheKeyParams = Object.assign({}, {search: options.search}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('albums', cacheKeyParams), () => {
                return client.search(options.search, queryParams);
            });
        }
        else { // User Albums
            let cacheKeyParams = Object.assign({}, {userId: options.userId}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('albums', cacheKeyParams), () => {
                return client.getAlbumsByUser(options.userId, queryParams);
            });
        }
    }

    convertToEntity(item, options) {
        return Mapper.mapAlbum(item);
    }

}

module.exports = AlbumModel;