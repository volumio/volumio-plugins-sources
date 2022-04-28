'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ytch = require('yt-channel-info');
const yts = require('youtube-scrape/scraper');
const ytpl = require('ytpl');
const ScraperBaseModel = require(__dirname + '/base');
const Playlist = require(yt2PluginLibRoot + '/core/entities/playlist');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');

class PlaylistModel extends ScraperBaseModel {

    getPlaylists(options = {}) {
        if (options.search) {
            return this.getItems(options);
        }
        else if (options.channelId) {
            return this._getChannelPlaylists(options);
        }
        return libQ.resolve([]);
    }

    getPlaylist(playlistId) {
        let defer = libQ.defer();

        yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('playlist', { playlistId: playlistId }), () => {
            // fetch with ytpl
            let ytplOptions = {
                limit: 1,
                hl: yt2.getConfigValue('language', 'en'),
                gl: yt2.getConfigValue('region', 'US')
            }
            return ytpl(playlistId, ytplOptions);
        }).then( (item) => {
            defer.resolve(new Playlist(item.id, item.title, item.bestThumbnail.url, new Channel(item.author.channelID, item.author.name)));
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer;
    }

    _getUploadsPlaylistInChannel(channelId) {
        let self = this;
        let defer = libQ.defer();

        // rely on ytpl-based getPlaylist() which accepts both playlistId and channelId
        self.getPlaylist(channelId).then( (playlist) => {
            defer.resolve(playlist);
        }).fail( (error) => {
            defer.resolve(null);
        });

        return defer;
    }

    _getChannelPlaylists(options) {
        let self = this;
        let defer = libQ.defer();

        let fetchUploadsPlaylist;
        if (!options.pageToken && !options.pageOffset) { // first page
            fetchUploadsPlaylist = self._getUploadsPlaylistInChannel(options.channelId);
        }
        else {
            fetchUploadsPlaylist = libQ.resolve(null);
        }
        fetchUploadsPlaylist.then( (uploadsPlaylist) => {
            let _options = Object.assign({}, options);
            if (uploadsPlaylist) {
                _options.limit = _options.limit ? _options.limit - 1 : 46;
            }
            self.getItems(_options).then( (playlists) => {
                if (uploadsPlaylist) {
                    playlists.items.unshift(uploadsPlaylist);
                }
                defer.resolve(playlists);
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        if (options.search) {  // fetch with youtube-scrape
            return yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('playlists', options), () => {
                let ytsKey, ytsPageToken;
                if (options.pageToken) {
                    let pageTokenObj = JSON.parse(options.pageToken);
                    ytsKey = pageTokenObj.key;
                    ytsPageToken = pageTokenObj.pageToken;
                }
                let ytsOptions = {
                    query: options.search,
                    type: 'playlist',
                    hl: yt2.getConfigValue('language', 'en'),
                    gl: yt2.getConfigValue('region', 'US')
                };
                return yts.youtube(ytsOptions, ytsKey, ytsPageToken);
            });
        }
        if (options.channelId) {  // fetch with yt-channel-info
            return yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('playlists', options), () => {
                return options.pageToken ? ytch.getChannelPlaylistsMore(options.pageToken) : ytch.getChannelPlaylistInfo(options.channelId);
            });
        }
        return libQ.resolve();
    }

    getItemsFromFetchResult(result, options) {
        if (options.search) {  // return from youtube-scrape response
            return result.results.slice(0);
        }
        if (options.channelId) {  // return from yt-channel-info response
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
        else if (options.channelId) {  // return from yt-channel-info response
            return result.continuation && result.items.length > 0 ? result.continuation : null;
        }
        return null;
    }

    convertToEntity(item, options) {
        if (options.search) {  // convert from youtube-scrape response
            // TODO: get channel ID like this : UrlHelper.getChannelId(item.uploader.url)
            let playlist = item.playlist;
            let uploader = item.uploader;
            return new Playlist(playlist.id, playlist.title, playlist.thumbnail_src, new Channel(null, uploader.username));
        }
        else if (options.channelId && item.type === 'playlist') {  // convert from yt-channel-info response
            return new Playlist(item.playlistId, item.title, item.playlistThumbnail, new Channel(options.channelId, item.author));
        }
        return null;
    }


}

module.exports = PlaylistModel;