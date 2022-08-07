'use strict';

const libQ = require('kew');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const BaseViewHandler = require(__dirname + '/base');

class RootViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();

        let myUsername = bandcamp.getConfigValue('myUsername');
        let fetches = myUsername ? [self._getFanSummary(myUsername)] : [];

        fetches.push(
            self._getArticles(),
            self._getShows(),
            self._getDiscoverResults()
        );

        libQ.all(fetches).then( (results) => {
            let lists = [];
            results.forEach( (result) => {
                lists = lists.concat(result);
            });

            defer.resolve( {
                navigation: {
                    prev: {
                        uri: '/'
                    },
                    lists
                }
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getFanSummary(username) {
        return this._getSectionLists(`${this.getUri()}/fan@username=${username}`);
    }

    _getArticles() {
        return this._getSectionLists(`${this.getUri()}/articles@inSection=1`);
    }

    _getShows() {
        return this._getSectionLists(`${this.getUri()}/shows@inSection=1`);
    }

    _getDiscoverResults() {
        return this._getSectionLists(`${this.getUri()}/discover@inSection=1`);
    }

    _getSectionLists(uri) {
        let defer = libQ.defer();

        require(bandcampPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(uri).browse()
            .then( (result) => {
                defer.resolve(result.navigation.lists);
            }).fail( (error) => {
                bandcamp.getLogger().error(error);
                defer.resolve([]);
            });

        return defer.promise;
    }

}

module.exports = RootViewHandler;