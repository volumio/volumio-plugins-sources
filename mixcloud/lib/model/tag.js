'use strict';

const mcfetch = require('mixcloud-fetch');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const EntityHelper = require(mixcloudPluginLibRoot + '/helper/entity');
const BaseModel = require(__dirname + '/base');

class TagModel extends BaseModel {

    getTags(options) {
        return this.getItems(options);
    }

    getFetchPromise(options) {
        let self = this;
        let cacheParams = ObjectHelper.assignProps(options, {}, ['keywords', 'limit', 'pageToken']);
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('tags', cacheParams), () => {
            let fetch;
            if (options.keywords) {
                let queryParams = ObjectHelper.assignProps(options, {}, [
                    'limit',
                    'pageToken'
                ]);
                fetch = mcfetch.search(options.keywords).getTags(queryParams);
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
        return EntityHelper.toSlugItem(item);
    }

    beforeResolve(results, lastFetchResult) {
        if (lastFetchResult.params) {
            results.params = lastFetchResult.params;
        }
        return results;
    }
    
}

module.exports = TagModel;