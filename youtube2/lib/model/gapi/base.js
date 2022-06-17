'use strict';

const libQ = require('kew');
const md5 = require('md5');
const yt2 = require(yt2PluginLibRoot + '/youtube2');

class GapiBaseModel {

    _doGetItems(apiFn, resource, options, defer, currentList = []) {
        let self = this;

        let filter = self.getFilter(options),
            pageOffset = (options && options.pageOffset) ? options.pageOffset : 0,
            limit = (options && options.limit) ? options.limit : 47,
            apiParams = self.getApiParams(options);

        yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch(resource, apiParams), () => {
            return apiFn(apiParams).then( result => self.afterApiFn(result, options) );
        }).then( (result) => {
            let items = result.data.items;
            if (pageOffset) {
                items.splice(0, pageOffset);
            }
            let itemCountToLimit =  limit - currentList.length; // number of items to add before hitting limit

            // pass items through filter
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

            let nextPageToken = null;
            if (result.data.nextPageToken) {
                nextPageToken = (nextPageOffset === 0) ? result.data.nextPageToken : (options.pageToken ? options.pageToken : null);
            }
            
            if (currentList.length < limit && nextPageToken) { // get more items
                options.pageToken = nextPageToken;
                options.pageOffset = 0;
                self._doGetItems(apiFn, resource, options, defer, currentList);
            }
            else {
                let entities = [];
                currentList.forEach( (item) => {
                    entities.push(self.convertToEntity(item));
                });

                defer.resolve({
                    items: entities,
                    nextPageToken: nextPageToken,
                    nextPageOffset: nextPageOffset
                });
            }                
        }).fail( (error) => {
            yt2.getLogger().error('[youtube2-model.gapi.base] _doGetItems(): ' + error.message + "\n" + error.stack);
            defer.reject(error);
        });

    }

    getItems(resource, options, apiFunction = 'list') {
        let self = this;
        let defer = libQ.defer();

        yt2.getGapiService().then( (service) => {
            let res = service.getResource(resource);
            if (!res || !res[apiFunction]) {
                return libQ.reject('Unknown resource / function');
            }
            return res[apiFunction].bind(res);

        }).then( (apiFn) => {
            self._doGetItems(apiFn, resource, Object.assign({}, options), defer);

        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getApiParams(options = {}) {
        let apiParams = {
            part: 'snippet',
            maxResults: 50,
            hl: yt2.getConfigValue('language', 'en')
        };

        if (options.pageToken) {
            apiParams.pageToken = options.pageToken;
        }
        
        return apiParams;
    }

    afterApiFn(result, options) {
        return result;
    }

    getFilter(options) {
        return null;
    }

    convertToEntity(item) {
        return null;
    }

    getThumbnail(item, quality = 'high') {
        if (item.snippet.thumbnails[quality]) {
            return item.snippet.thumbnails[quality].url;
        }
        
        return '/albumart';
    }

    getCacheKeyForFetch(resourceName, fetchOptions) {
        let key = `yt2.model.gapi.${resourceName}`;
        let opKeys = Object.keys(fetchOptions);
        let sorted = opKeys.sort();
        sorted.forEach( (k) => {
            let s = `${k}=${encodeURIComponent(fetchOptions[k])}`;
            key += '@' + s;
        });
        return md5(key);
    }

}

module.exports = GapiBaseModel;