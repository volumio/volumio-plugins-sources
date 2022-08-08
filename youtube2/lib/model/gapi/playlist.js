'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const GapiBaseModel = require(__dirname + '/base');
const Playlist = require(yt2PluginLibRoot + '/core/entities/playlist');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');

class PlaylistModel extends GapiBaseModel {

    getPlaylists(options = {}) {
        if (options.search) {
            return this.getItems('search', options);
        }
        else if (options.channelId) {
            return this._getChannelPlaylists(options);
        }
        else {
            //return this.getItems('playlists', options);
            return this._getMyChannelPlaylists(options);
        }
    }

    getPlaylist(playlistId) {
        let defer = libQ.defer();
        let self = this;

        let apiParams = {
            part: 'snippet',
            id: playlistId,
            hl: yt2.getConfigValue('language', 'en')
        };

        yt2.getGapiService().then( (service) => {
            yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('playlists', apiParams), () => {
                return service.getResource('playlists').list(apiParams);
            }).then( (playlists) => {
                if (playlists.data.items.length) {
                    let item = playlists.data.items[0];
                    let playlist = new Playlist(item.id, item.snippet.title, self.getThumbnail(item), new Channel(item.snippet.channelId, item.snippet.channelTitle));
                    defer.resolve(playlist);
                }
                else {
                    defer.resolve(null);
                }
            })
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getUploadsPlaylistInChannel(channelId) {
        let defer = libQ.defer();
        let self = this;

        let apiParams = {
            part: 'snippet,contentDetails',
            id: channelId,
            hl: yt2.getConfigValue('language', 'en')
        };

        // First obtain the ID of the playlist for uploads,
        // then fetch playlist info
        yt2.getGapiService().then( (service) => {
            yt2.getCache().cacheOrPromise(this.getCacheKeyForFetch('channels', apiParams), () => {
                return service.getResource('channels').list(apiParams);
            }).then( (channel) => {
                if (channel.data.items.length) {
                    let uploadsPlaylistId = channel.data.items[0].contentDetails.relatedPlaylists.uploads;
                    if (uploadsPlaylistId) {
                        self.getPlaylist(uploadsPlaylistId).then( (playlist) => {
                            defer.resolve(playlist);
                        }).fail( (error) => {
                            defer.resolve(null);
                        });
                    }
                    else {
                        defer.resolve(null);
                    }
                }
                else {
                    defer.resolve(null);
                }
            })
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
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
            self.getItems('playlists', _options).then( (playlists) => {
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

    _getRelatedPlaylistsInMyChannel() {
        let defer = libQ.defer();
        let self = this;

        let apiParams = {
            part: 'snippet,contentDetails',
            mine: true,
            hl: yt2.getConfigValue('language', 'en')
        };

        // First obtain the IDs of the related playlists,
        // then fetch playlist info
        yt2.getGapiService().then( (service) => {
            yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('channels', apiParams), () => {
                return service.getResource('channels').list(apiParams);
            }).then( (channel) => {
                if (channel.data.items.length) {
                    let relatedPlaylists = channel.data.items[0].contentDetails.relatedPlaylists;
                    let relatedPlaylistIds = [relatedPlaylists.likes,
                        relatedPlaylists.favorites,
                        relatedPlaylists.uploads].filter( id => id ).join(',');
                    if (relatedPlaylistIds) {
                        apiParams = {
                            part: 'snippet',
                            id: relatedPlaylistIds,
                            hl: yt2.getConfigValue('language', 'en')
                        };
                        yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('playlists', apiParams), () => {
                            return service.getResource('playlists').list(apiParams);
                        }).then( (playlists) => {
                            let result = [];
                            playlists.data.items.forEach( (item) => {
                                result.push(new Playlist(item.id, item.snippet.title, self.getThumbnail(item), new Channel(item.snippet.channelId, item.snippet.channelTitle)));
                            });
                            defer.resolve(result);
                        }).fail( (error) => {
                            defer.resolve([]);
                        });
                    }
                    else {
                        defer.resolve([]);
                    }
                }
                else {
                    defer.resolve([]);
                }
            }).fail( (error) => {
                defer.resolve([]);
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getMyChannelPlaylists(options) {
        let self = this;
        let defer = libQ.defer();

        let fetchRelatedPlaylists;
        if (!options.pageToken && !options.pageOffset) { // first page
            fetchRelatedPlaylists = self._getRelatedPlaylistsInMyChannel();
        }
        else {
            fetchRelatedPlaylists = libQ.resolve([]);
        }
        fetchRelatedPlaylists.then( (relatedPlaylists) => {
            let _options = Object.assign({}, options);
            if (relatedPlaylists) {
                _options.limit = _options.limit ? _options.limit - relatedPlaylists.length : 47 - relatedPlaylists.length;
            }
            if (_options.limit > 0) {
                self.getItems('playlists', _options).then( (playlists) => {
                    if (relatedPlaylists) {
                        let joined = relatedPlaylists.concat(playlists.items);
                        playlists.items = joined;
                    }
                    defer.resolve(playlists);
                });
            }
            else {
                defer.resolve(relatedPlaylists);
            }
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getApiParams(options) {
        let apiParams = super.getApiParams(options);

        if (options.search) {
            apiParams.type = 'playlist';
            apiParams.q = options.search;
            apiParams.regionCode = yt2.getConfigValue('region', 'US');
        }
        else if (options.channelId) {
            apiParams.channelId = options.channelId;
        }
        else {
            apiParams.mine = true;
        }

        return apiParams;
    }

    convertToEntity(item) {
        let playlistId = (item.kind === 'youtube#searchResult') ? item.id.playlistId : item.id;
        return new Playlist(playlistId, item.snippet.title, this.getThumbnail(item), new Channel(item.snippet.channelId, item.snippet.channelTitle));
    }

}

module.exports = PlaylistModel;