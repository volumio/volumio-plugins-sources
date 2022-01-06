'use strict';

const mcfetch = require('mixcloud-fetch');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const EntityHelper = require(mixcloudPluginLibRoot + '/helper/entity');
const BaseModel = require(__dirname + '/base');

class CloudcastModel extends BaseModel {

    getCloudcasts(options) {
        let self = this;
        return self.getItems(options).then( results => {
            self.cacheCloudcasts(results.items);
            return results;
        });
    }

    getSearchOptions() {
        let options = {};

        options.dateUploaded = [
            { name: 'past_week', value: 'pastWeek' },
            { name: 'past_month', value: 'pastMonth' },
            { name: 'past_year', value: 'pastYear' },
            { name: 'any_time', value: 'anyTime' }
        ];

        return options;
    }

    getCloudcast(cloudcastId) {
        let self = this;
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('cloudcast', { cloudcastId }), () => {
            return mcfetch.cloudcast(cloudcastId).getInfo().then( info => {
                return self.convertToEntity(info);
            });
        });
    }

    getFetchPromise(options) {
        let self = this;
        let cacheParams = ObjectHelper.assignProps(options, {}, ['username', 'playlistId', 'keywords', 'dateUploaded', 'orderBy', 'limit', 'pageToken']);
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('cloudcasts', cacheParams), () => {
            let fetch;
            if (options.username) {
                let queryParams = ObjectHelper.assignProps(options, {}, [
                    'orderBy',
                    'limit',
                    'pageToken'
                ]);
                fetch = mcfetch.user(options.username).getShows(queryParams);
            }
            else if (options.playlistId) {
                let queryParams = ObjectHelper.assignProps(options, {}, [
                    'limit',
                    'pageToken'
                ]);
                fetch = mcfetch.playlist(options.playlistId).getShows(queryParams);
            }
            else if (options.keywords) {
                let queryParams = ObjectHelper.assignProps(options, {}, [
                    'dateUploaded',
                    'limit',
                    'pageToken'
                ]);
                fetch = mcfetch.search(options.keywords).getShows(queryParams);
            }
            return fetch;
        });
    }

    getItemsFromFetchResult(result, options) {
        return result.items.slice(0);
    }

    getNextPageTokenFromFetchResult(result, options) {
        if (result.nextPageToken != null && result.items.length > 0) {
            return result.nextPageToken;
        }
        else {
            return null;
        }
    }

    convertToEntity(item, options) {
        return EntityHelper.toCloudcast(item);
    }

    beforeResolve(results, lastFetchResult) {
        if (lastFetchResult.params) {
            results.params = lastFetchResult.params;
        }
        return results;
    }

}

module.exports = CloudcastModel;