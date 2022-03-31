'use strict';

const libQ = require('kew');
const mcfetch = require('mixcloud-fetch');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const BaseModel = require(__dirname + '/base');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const EntityHelper = require(mixcloudPluginLibRoot + '/helper/entity');

class DiscoverModel extends BaseModel {

    getDiscoverResults(options) {
        let self = this;
        return self.getItems(options).then( results => {
            self.cacheCloudcasts(results.items);
            return results;
        });
    }
 
    getCategories() {
        return mixcloud.getCache().cacheOrPromise(this.getCacheKeyForFetch('categories'), () => {
            return mcfetch.misc.getCategories();
        }).then( categories => {
            let result = {};
            for (const [section, sectionCategories] of Object.entries(categories)) {
                result[section] = [];
                sectionCategories.forEach( sc => {
                    result[section].push(EntityHelper.toSlugItem(sc));
                });
            }
            return result;
        });
    }

    getCountries() {
        return mixcloud.getCache().cacheOrPromise(this.getCacheKeyForFetch('countries'), () => {
            return mcfetch.misc.getCountries();
        });
    }

    getDiscoverOptions(forParams) {
        let self = this;
        let defer = libQ.defer();

        let fetches = [
            self.getCategories(),
            self.getCountries()
        ];

        Promise.all(fetches).then( results => {
            let options = {};
            if (forParams.list === 'all') {
                options.orderBy = [
                    { name: 'trending', value: 'trending' },
                    { name: 'popular', value: 'popular' },
                    { name: 'latest', value: 'latest' }
                ];
            }
            else if (forParams.list === 'featured') {
                options.orderBy = [
                    { name: 'popular', value: 'popular' },
                    { name: 'latest', value: 'latest' }
                ];
            }

            let [categories, countries] = results;

            options.slug = [];
            for (const [section, sectionCategories] of Object.entries(categories)) {
                sectionCategories.forEach( sc => {
                    options.slug.push({
                        name: sc.name,
                        value: sc.slug,
                        section
                    });
                })
            }
            if (forParams.list === 'featured') {
                options.slug.unshift({
                    name: 'all',
                    value: null
                });
            }

            // Calling function may need accesss to all countries even if 
            // they do not appear in the discover options
            options.allCountries = countries.available.map( country => {
                return {
                    name: country.name,
                    value: country.code
                };
            });

            if (forParams.list === 'all' && forParams.orderBy == 'trending') {
                options.country = options.allCountries;
            }

            defer.resolve(options);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        let self = this;
        let cacheParams = ObjectHelper.assignProps(options, {}, ['slug', 'list', 'orderBy', 'country', 'limit', 'pageToken']);
        return mixcloud.getCache().cacheOrPromise(self.getCacheKeyForFetch('cloudcasts', cacheParams), () => {
            let queryParams = ObjectHelper.assignProps(options, {}, [
                'orderBy',
                'limit',
                'pageToken'
            ]);

            let fetch;
            if (options.list === 'all') {
                fetch = mcfetch.tag(options.slug).getShows(
                    ObjectHelper.assignProps(options, queryParams, ['country'])
                );
            }
            else if (options.list === 'featured') {
                fetch = mcfetch.tag(options.slug).getFeatured(queryParams);
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
        return ObjectHelper.assignProps(lastFetchResult, results, ['params', 'selectedTags']);
    }

}

module.exports = DiscoverModel;