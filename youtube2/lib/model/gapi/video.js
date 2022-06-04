'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const GapiBaseModel = require(__dirname + '/base');
const Video = require(yt2PluginLibRoot + '/core/entities/video');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');
const iso8601Duration = require('iso8601-duration');

class VideoModel extends GapiBaseModel {

    getVideos(options = {}) {
        let resource;
        let self = this;

        if (options.search) {
            resource = 'search';
        }
        else if (options.playlistId) {
            resource = 'playlistItems';
        }
        else { // liked videos
            resource = 'videos';
        }

        let defer = libQ.defer();
        self.getItems(resource, options).then( (videos) => {
            let cache = yt2.getCache();
            let keyData = {
                part: 'snippet',
                hl: yt2.getConfigValue('language', 'en')
            };
            videos.items.forEach( (video) => {
                keyData.id = video.id;
                let key = self.getCacheKeyForFetch('video', keyData);
                cache.put(key, video);
            });
            defer.resolve(videos);
        }).fail( (error) => {
            defer.reject(error);
        });
        return defer.promise;
    }

    getVideo(videoId) {
        let self = this;

        let apiParams = {
            part: 'snippet,contentDetails',
            id: videoId,
            hl: yt2.getConfigValue('language', 'en')
        };

        return yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('video', apiParams), () => {
            return self._doGetVideo(apiParams);
        });
    }

    _doGetVideo(apiParams) {
        let self = this;
        let defer = libQ.defer();

        yt2.getGapiService().then( (service) => {
            service.getResource('videos').list(apiParams).then( (videos) => {
                if (videos.data.items.length) {
                    let item = videos.data.items[0];
                    let durationSec = iso8601Duration.toSeconds(item.contentDetails.duration);
                    let video = new Video(item.id, item.snippet.title, self.getThumbnail(item), new Channel(item.snippet.channelId, item.snippet.channelTitle), durationSec);
                    defer.resolve(video);
                }
                else {
                    defer.resolve(null);
                }
            }).catch( (error) => {
                defer.reject(error);
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getApiParams(options) {
        let apiParams = super.getApiParams(options);

        if (options.search) {
            apiParams.type = 'video';
            apiParams.q = options.search;
            apiParams.regionCode = yt2.getConfigValue('region', 'US');
        }
        else if (options.playlistId) {
            apiParams.playlistId = options.playlistId;
            apiParams.part = 'snippet,status';
        }
        else { // liked videos
            apiParams.myRating = 'like';
            apiParams.part = 'snippet,contentDetails,status';
        }

        return apiParams;
    }

    getFilter(options) { 
        if (options.search) {
            return null;
        }
        else if (options.playlistId) {
            return playlistItem => 
                playlistItem.snippet.resourceId.kind === 'youtube#video' &&
                playlistItem.status.privacyStatus !== 'private';
        }
        else { // liked videos
            return playlistItem => playlistItem.status.privacyStatus !== 'private';
        }
    }

    afterApiFn(result, options) {
        if ((!options.search && !options.playlistId) || result.data.items.length === 0) {
            return result;
        }

        let defer = libQ.defer();
        let videoIds;
        if (options.search) {
            videoIds = result.data.items.map( item => item.id.videoId );
        }
        else { // playlist items
            videoIds = result.data.items.map( item => item.snippet.resourceId.videoId );
        }
        let apiParams = {
            part: 'contentDetails',
            id: videoIds.join(),
            hl: yt2.getConfigValue('language', 'en')
        };
        yt2.getGapiService().then( (service) => {
            service.getResource('videos').list(apiParams).then( (videos) => {
                for (let i = 0; i < videos.data.items.length; i++) {
                    let item = result.data.items[i];
                    if (item) {
                        if (!item.contentDetails) {
                            item.contentDetails = {};
                        }
                        item.contentDetails.duration = videos.data.items[i].contentDetails.duration;
                    }
                }
                defer.resolve(result);
            }).catch( (error) => {
                defer.reject(error);
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    convertToEntity(item) {
        let videoId;
        if (item.kind === 'youtube#playlistItem') {
            videoId = item.snippet.resourceId.videoId;
        }
        else if (item.kind === 'youtube#searchResult') {
            videoId = item.id.videoId;
        }
        else {
            videoId = item.id;
        }
        let durationSec = item.contentDetails && item.contentDetails.duration ? iso8601Duration.toSeconds(iso8601Duration.parse(item.contentDetails.duration)) : null;
        return new Video(videoId, item.snippet.title, this.getThumbnail(item), new Channel(item.snippet.channelId, item.snippet.channelTitle), durationSec);
    }

}

module.exports = VideoModel;