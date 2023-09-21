'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ViewHandlerFactory = require(mixcloudPluginLibRoot  + '/controller/browse/view-handlers/factory');

class SearchController {

    search(query) {
        let self = this;
        let defer = libQ.defer();
      
        let safeQuery = encodeURIComponent(query.value.replace(/"/g, '\\"'));
        
        let fetches = [
            self._getSearchResults(`mixcloud/tags@keywords=${safeQuery}@inSection=1`),
            self._getSearchResults(`mixcloud/cloudcasts@keywords=${safeQuery}@inSection=1`),
            self._getSearchResults(`mixcloud/users@keywords=${safeQuery}@inSection=1`)
        ];

        libQ.all(fetches).then( results => {
            let lists = [];
            results.forEach( result => {
                lists = lists.concat(result);
            });
            defer.resolve(lists);
        }).fail( error => {
            mixcloud.getLogger().error('[mixcloud-search] search() error:');
            mixcloud.getLogger().error(error);
            defer.resolve([]);
        });

        return defer.promise;
    }

    _getSearchResults(searchUri) {
        let handler = ViewHandlerFactory.getHandler(searchUri);
        return handler.browse().then( result => {
            let lists = result.navigation.lists;
            if (lists.length && lists[lists.length - 1].items.length) {
                return result.navigation.lists;
            }
            else {
                return [];
            }
        });
    }
}

module.exports = SearchController;