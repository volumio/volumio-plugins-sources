'use strict';

const mcfetch = require('mixcloud-fetch');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const BaseModel = require(__dirname + '/base');
const EntityHelper = require(mixcloudPluginLibRoot + '/helper/entity');

class PlaylistModel extends BaseModel {

    getPlaylists(options) {
        return this.getItems(options);
    }

    getPlaylist(playlistId) {
        let self = this;
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('playlist', { playlistId }), () => {
            return mcfetch.playlist(playlistId).getInfo().then( info => {
                return self.convertToEntity(info);
            });
        });
    }

    getFetchPromise(options) {
        let self = this;
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('playlists', { username: options.username }), () => {
            return mcfetch.user(options.username).getPlaylists();
        });
    }

    getItemsFromFetchResult(result, options) {
        return result.items.slice(0);
    }

    convertToEntity(item, options) {
        return EntityHelper.toPlaylist(item);
    }

    
}

module.exports = PlaylistModel;