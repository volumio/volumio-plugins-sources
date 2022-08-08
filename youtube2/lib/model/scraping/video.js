'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ytpl = require('ytpl');
const ytdl = require('ytdl-core');
const yts = require('youtube-scrape/scraper');
const ScraperBaseModel = require(__dirname + '/base');
const Video = require(yt2PluginLibRoot + '/core/entities/video');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');
const timeToSeconds = require('time-to-seconds');

class VideoModel extends ScraperBaseModel {

    getVideos(options = {}) {
        let self = this;

        if (options.playlistId || options.search) {
            let defer = libQ.defer();
            self.getItems(options).then( (videos) => {
                let cache = yt2.getCache();
                videos.items.forEach( (video) => {
                    let keyData = { videoId: video.id };
                    let key = self.getCacheKeyForFetch('video', keyData);
                    cache.put(key, video);
                });
                defer.resolve(videos);
            }).fail( (error) => {
                defer.reject(error);
            });
            return defer.promise;
        }
        return libQ.resolve([]);
    }

    getVideo(videoId) {
        let self = this;

        return yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('video', { videoId: videoId }), () => {
            return self._doGetVideo(videoId);
        });
    }

    _doGetVideo(videoId) {
        let defer = libQ.defer();

        // get with ytdl-core
        ytdl.getBasicInfo(videoId).then( (result) => {
            let info = result.videoDetails;
            let thumbnail = info.thumbnails ? info.thumbnails.pop().url : '/albumart';
            let video = new Video(info.videoId, info.title, thumbnail, new Channel(info.externalChannelId, info.ownerChannelName), info.lengthSeconds);
            defer.resolve(video);
        }).catch( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        if (options.search) {
            return yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('videos', options), () => {
                // fetch with youtube-scrape
                let ytsKey, ytsPageToken;
                if (options.pageToken) {
                    let pageTokenObj = JSON.parse(options.pageToken);
                    ytsKey = pageTokenObj.key;
                    ytsPageToken = pageTokenObj.pageToken;
                }
                let ytsOptions = {
                    query: options.search,
                    type: 'video',
                    hl: yt2.getConfigValue('language', 'en'),
                    gl: yt2.getConfigValue('region', 'US')
                };
                return yts.youtube(ytsOptions, ytsKey, ytsPageToken);
            });
        }
        if (options.playlistId) {
            return yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('videos', options), () => {
                // fetch with ytpl
                if (options.pageToken) {
                    let continuation = JSON.parse(options.pageToken);
                    continuation[3].limit = Infinity;
                    return ytpl.continueReq(continuation);
                }
                else {
                    let ytplOptions = {
                        pages: 1,
                        hl: yt2.getConfigValue('language', 'en'),
                        gl: yt2.getConfigValue('region', 'US')
                    }
                    return ytpl(options.playlistId, ytplOptions);
                }
            });
        }
        return libQ.resolve();
    }

    getItemsFromFetchResult(result, options) {
        if (options.search) {  // return from youtube-scrape response
            return result.results.slice(0);
        }
        if (options.playlistId) {  // return from ytpl response
            return result.items.slice(0);
        }
        return [];
    }

    getNextPageTokenFromFetchResult(result, options) {
        if (options.search) {  // return from youtube-scrape response
            if (result.key && result.nextPageToken && result.results.length > 0) {
                return JSON.stringify({
                    key: result.key,
                    pageToken: result.nextPageToken
                });
            }
        }
        else if (options.playlistId) { // return from ytpl response
            if (result.continuation && result.items.length > 0) {
                return JSON.stringify(result.continuation);
            }
        }
        return null;
    }

    convertToEntity(item, options) {
        if (options.search) {  // convert from youtube-scrape response
            // TODO: get channel ID like this : UrlHelper.getChannelId(item.uploader.url)
            let video = item.video;
            let uploader = item.uploader;
            let durationSec;
            try {
                durationSec = timeToSeconds(video.duration);
            } catch (e) {
                durationSec = null;
            }

            return new Video(video.id, video.title, video.thumbnail_src, new Channel(null, uploader.username), durationSec);
        }
        else if (options.playlistId) {  // convert from ytpl response
            return new Video(item.id, item.title, item.bestThumbnail.url, new Channel(item.author.channelID, item.author.name), item.durationSec);
        }
        return null;
    }

}

module.exports = VideoModel;