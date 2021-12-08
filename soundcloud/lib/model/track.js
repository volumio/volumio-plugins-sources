'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseModel = require(__dirname + '/base');
const Mapper = require(__dirname + '/mapper');
const TrackHelper = require(scPluginLibRoot + '/helper/track');

class TrackModel extends BaseModel {

    getTracks(options) {
        let self = this;

        if (options.search || options.userId || options.topFeatured) {
            let defer = libQ.defer();
            self.getItems(options).then( (tracks) => {
                TrackHelper.cacheTracks(tracks.items, self.getCacheKeyForFetch.bind(self));
                defer.resolve(tracks);
            }).fail( (error) => {
                defer.reject(error);
            });
            return defer.promise;
        }
        return libQ.resolve([]);
    }

    getTrack(trackId) {
        let self = this;

        // Unlike other resources, tracks are mapped via convertToEntity()
        // before being cached.
        return sc.getCache().cacheOrPromise(self.getCacheKeyForFetch('track', { trackId: trackId }), () => {
            return self._doGetTrack(trackId);
        });
    }

    _doGetTrack(trackId) {
        let defer = libQ.defer();
        let self = this;

        self.getSoundCloudClient().getTrack(trackId).then( (trackInfo) => {
            let track = self.convertToEntity(trackInfo);
            defer.resolve(track);
        }).catch( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getRealMediaUrl(transcodingUrl) {
        let self = this;
        let defer = libQ.defer();

        self.getSoundCloudClient().getRealMediaUrl(transcodingUrl).then( (url) => {
            defer.resolve(url);
        }).catch( (error) => {
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
            queryParams.type = 'track';
            let cacheKeyParams = Object.assign({}, {search: options.search}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => {
                return client.search(options.search, queryParams);
            });
        }
        else if (options.userId) {
            let cacheKeyParams = Object.assign({}, {userId: options.userId}, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => {
                return client.getTracksByUser(options.userId, queryParams);
            });
        }
        else if (options.topFeatured) {
            let cacheKeyParams = Object.assign({}, { topFeatured: true }, queryParams);
            return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => {
                return client.getTopFeaturedTracks(queryParams);
            });
        }
    }

    convertToEntity(item, options) {
        return Mapper.mapTrack(item);
    }

}

module.exports = TrackModel;