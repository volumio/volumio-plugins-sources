'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const yts = require('youtube-scrape/scraper');
const ytch = require('yt-channel-info');
const ScraperBaseModel = require(__dirname + '/base');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');

class ChannelModel extends ScraperBaseModel {

    getChannels(options) {
        if (options.search) {
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getChannel(channelId) {
        let defer = libQ.defer();

        yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('channel', { channelId: channelId }), () => {
            // get with yt-channel-info
            // TODO: we should mod yt-channel-info to use hl/gl
            return ytch.getChannelInfo(channelId);
        }).then( (info) => {
            let thumbnail = info.authorThumbnails ? info.authorThumbnails.pop().url : '/albumart';
            let channel = new Channel(info.authorId, info.author, thumbnail, info.description);
            defer.resolve(channel);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        if (options.search) {  // fetch with youtube-scrape
            return yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('channels', options), () => {
                let ytsKey, ytsPageToken;
                if (options.pageToken) {
                    let pageTokenObj = JSON.parse(options.pageToken);
                    ytsKey = pageTokenObj.key;
                    ytsPageToken = pageTokenObj.pageToken;
                }
                let ytsOptions = {
                    query: options.search,
                    type: 'channel',
                    hl: yt2.getConfigValue('language', 'en'),
                    gl: yt2.getConfigValue('region', 'US')
                };
                return yts.youtube(ytsOptions, ytsKey, ytsPageToken);
            });
        }
        return libQ.resolve();
    }

    getItemsFromFetchResult(result, options) {
        if (options.search) {  // return from youtube-scrape response
            return result.results.slice(0);
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
        return null;
    }

    convertToEntity(item, options) {
        if (options.search) {  // convert from youtube-scrape response
            let channel = item.channel;
            let thumbnail = channel.thumbnail_src;
            if (!thumbnail.startsWith('https:')) {
                thumbnail = 'https:' + thumbnail;
            }
            return new Channel(channel.id, channel.title, thumbnail);
        }
        return null;
    }

}

module.exports = ChannelModel;