'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseModel = require(__dirname + '/base');
const Mapper = require(__dirname + '/mapper');
const TrackHelper = require(scPluginLibRoot + '/helper/track');

class PlaylistModel extends BaseModel {

    getPlaylists(options) {
        if (options.search || options.userId) {
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getPlaylist(playlistId, options = {}) {
        let self = this;
        let defer = libQ.defer();

        let cacheKeyParams = Object.assign({}, {playlistId: playlistId}, options);
        sc.getCache().cacheOrPromise(self.getCacheKeyForFetch('playlist', cacheKeyParams), () => {
            if (options.type === 'system') {
                return self.getSoundCloudClient().getSystemPlaylist(playlistId);
            }
            else {
                return self.getSoundCloudClient().getPlaylist(playlistId);
            }
        }).then( (info) => {
            let playlist = self.convertToEntity(info);
            playlist.tracks = [];
            if (options.loadTracks) {
                let offset = options.tracksOffset || 0;
                let limit = options.tracksLimit || false;
                info.getTracks({ offset, limit }).then( (tracks) => {
                    tracks.forEach( (trackInfo) => {
                        playlist.tracks.push(Mapper.mapTrack(trackInfo));
                    });
                    TrackHelper.cacheTracks(playlist.tracks, self.getCacheKeyForFetch.bind(self));
                    defer.resolve(playlist);
                }).catch( (error) => {
                    defer.reject(error);
                });
            }
            else {
                defer.resolve(playlist);
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
            queryParams.type = 'playlist';
            let cacheKeyParams = Object.assign({}, {search: options.search}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('playlists', cacheKeyParams), () => {
                return client.search(options.search, queryParams);
            });
        }
        else { // User Playlists
            let cacheKeyParams = Object.assign({}, {userId: options.userId}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('playlists', cacheKeyParams), () => {
                return client.getPlaylistsByUser(options.userId, queryParams);
            });
        }
    }

    convertToEntity(item, options) {
        return Mapper.mapPlaylist(item);
    }

}

module.exports = PlaylistModel;