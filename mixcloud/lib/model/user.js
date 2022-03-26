'use strict';

const mcfetch = require('mixcloud-fetch');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const EntityHelper = require(mixcloudPluginLibRoot + '/helper/entity');
const BaseModel = require(__dirname + '/base');

class UserModel extends BaseModel {

    getUsers(options) {
        return this.getItems(options);
    }

    getShowsOptions() {
        let options = {};

        options.orderBy = [
            { name: 'trending', value: 'trending' },
            { name: 'popular', value: 'popular' },
            { name: 'latest', value: 'latest' },
            { name: 'oldest', value: 'oldest' }
        ];

        return options;
    }

    getSearchOptions() {
        let options = {};

        options.dateJoined = [
            { name: 'past_week', value: 'pastWeek' },
            { name: 'past_month', value: 'pastMonth' },
            { name: 'past_year', value: 'pastYear' },
            { name: 'any_time', value: 'anyTime' }
        ];

        options.userType = [
            { name: 'uploader', value: 'uploader' },
            { name: 'listener', value: 'listener' },
            { name: 'any', value: 'any' }
        ];

        return options;
    }

    getUser(username) {
        let self = this;
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('user', { username }), () => {
            return mcfetch.user(username).getInfo().then( info => {
                return self.convertToEntity(info);
            });
        });
    }

    getFetchPromise(options) {
        let self = this;
        let cacheParams = ObjectHelper.assignProps(options, {}, ['keywords', 'dateJoined', 'userType', 'limit', 'pageToken']);
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('users', cacheParams), () => {
            let fetch;
            if (options.keywords) {
                let queryParams = ObjectHelper.assignProps(options, {}, [
                    'dateJoined',
                    'userType',
                    'limit',
                    'pageToken'
                ]);
                fetch = mcfetch.search(options.keywords).getUsers(queryParams);
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
        return EntityHelper.toUser(item);
    }

    beforeResolve(results, lastFetchResult) {
        if (lastFetchResult.params) {
            results.params = lastFetchResult.params;
        }
        return results;
    }
    
}

module.exports = UserModel;