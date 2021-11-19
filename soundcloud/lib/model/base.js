'use strict';

const libQ = require('kew');
const md5 = require('md5');
const sc = require(scPluginLibRoot + '/soundcloud');
const SoundCloudClient = require('soundcloud-fetch');

class BaseModel {

    _doGetItems(options, defer, currentList = [], iteration = 1) {
        let self = this;

        let filter = self.getFilter(options),
            pageOffset = (options && options.pageOffset) ? options.pageOffset : 0,
            limit = (options && options.limit) ? options.limit : 47;

        let fetchPromise = self.getFetchPromise(options);

        fetchPromise.then( (result) => {
            let items = self.getItemsFromFetchResult(result, options);
            if (pageOffset) {
                items.splice(0, pageOffset);
            }
            let itemCountToLimit = limit - currentList.length; // number of items to add before hitting limit

            let nextPageOffset;
            if (items && filter) { 
                let itemOffset = 0;
                let includeCount = 0;
                let filtered = items.filter( (item) => {
                    if (includeCount >= itemCountToLimit) {
                        return false;
                    }
                    let inc = filter(item);
                    if (inc) {
                        includeCount++;
                    }
                    itemOffset++;
                    return inc;
                });
                if (itemOffset === items.length) {
                    nextPageOffset = 0;
                }
                else {
                    nextPageOffset = itemOffset;
                }
                items = filtered;
            }
            else if (items) {
                if (items.length > itemCountToLimit) {
                    items.splice(itemCountToLimit);
                    nextPageOffset = items.length;
                }
                else {
                    nextPageOffset = 0;
                }
            }
            currentList = currentList.concat(items);

            let nextPageToken = null,
                nextPageTokenFromResult = self.getNextPageTokenFromFetchResult(result, options);
            if (nextPageTokenFromResult) {
                nextPageToken = (nextPageOffset === 0) ? nextPageTokenFromResult : (options.pageToken ? options.pageToken : null);
            }
            
            iteration++;
            let maxIt = self.getMaxFetchIterations(options);
            let maxFetchIterationsReached = maxIt && iteration > maxIt;
            if (!maxFetchIterationsReached && currentList.length < limit && nextPageToken) { // get more items
                options.pageToken = nextPageToken;
                options.pageOffset = 0;
                self._doGetItems(options, defer, currentList, iteration);
            }
            else {
                let entities = [];
                currentList.forEach( (item) => {
                    entities.push(self.convertToEntity(item, options));
                });

                defer.resolve({
                    items: entities,
                    nextPageToken: maxFetchIterationsReached ? null : nextPageToken,
                    nextPageOffset: maxFetchIterationsReached ? 0 : nextPageOffset
                });
            }
        }).fail( (error) => {
            sc.getLogger().error('[soundcloud-model.base] getItems(): ' + error.message + "\n" + error.stack);
            defer.reject(error);
        });
    }

    getItems(options) {
        let defer = libQ.defer();

        this._doGetItems(Object.assign({}, options), defer);

        return defer.promise;
    }

    getFetchPromise(options) {
        return libQ.resolve();
    }
    
    getItemsFromFetchResult(result, options) {
        return result.getItems();
    }

    getNextPageTokenFromFetchResult(result, options) {
        let items = this.getItemsFromFetchResult(result);
        if (Array.isArray(items) && items.length > 0 && result.getNextUri() !== null) {
            let offset = options.pageToken || 0;
            return offset + this.getQueryMaxLimit();
        }
        return null;
    }

    getFilter(options) {
        return null;
    }

    getMaxFetchIterations(options) {
        return false;
    }

    convertToEntity(item, options) {
        return null;
    }

    getSoundCloudClient() {
        let client = sc.get('model.soundcloudClient');
        if (!client) {
            client = new SoundCloudClient();
            sc.set('model.soundcloudClient', client);
        }
        client.setLocale(sc.getConfigValue('locale', 'en'));
        return client;
    }

    getCacheKeyForFetch(resourceName, cacheKeyParams) {
        let key = `sc.model.${resourceName}`;
        cacheKeyParams.locale = sc.getConfigValue('locale', 'en');
        let opKeys = Object.keys(cacheKeyParams);
        let sorted = opKeys.sort();
        sorted.forEach( (k) => {
            let s = `${k}=${encodeURIComponent(cacheKeyParams[k])}`;
            key += '@' + s;
        });
        return md5(key);
    }

    getQueryMaxLimit() {
        return SoundCloudClient.Constants.QUERY_MAX_LIMIT;
    }

}

module.exports = BaseModel;