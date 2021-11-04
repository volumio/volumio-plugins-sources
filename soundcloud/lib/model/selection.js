'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BaseModel = require(__dirname + '/base');
const Mapper = require(__dirname + '/mapper');

class SelectionModel extends BaseModel {

    getSelections(options) {
        if (options.mixed) {
            return this.getItems(options);
        }
        return libQ.resolve([]);
    }

    getFetchPromise(options) {
        let client = this.getSoundCloudClient();

        // Only mixed selections supported (without options)
        return sc.getCache().cacheOrPromise(this.getCacheKeyForFetch('selections', { mixed: true }), () => {
            return client.getMixedSelections();
        });
    }

    convertToEntity(item, options) {
        return Mapper.mapSelection(item);
    }

}

module.exports = SelectionModel;