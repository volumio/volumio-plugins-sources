'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseModel = require(__dirname + '/base');
const Mapper = require(__dirname + '/mapper');

class UserModel extends BaseModel {

    getUsers(options) {
        if (options.search) {
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getUser(userId) {
        let self = this;
        let defer = libQ.defer();

        sc.getCache().cacheOrPromise(self.getCacheKeyForFetch('user', { userId: userId }), () => {
            return self.getSoundCloudClient().getUser(userId);
        }).then( (info) => {
            let user = self.convertToEntity(info);
            defer.resolve(user);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getFetchPromise(options) {
        let client = this.getSoundCloudClient();
        let queryParams = {
            type: 'user',
            offset: options.pageToken || 0,
            limit: this.getQueryMaxLimit()
        };
        let cacheKeyParams = Object.assign({}, {search: options.search}, queryParams);
        return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('users', cacheKeyParams), () => {
            return client.search(options.search, queryParams);
        });
    }

    convertToEntity(item, options) {
        return Mapper.mapUser(item);
    }

}

module.exports = UserModel;