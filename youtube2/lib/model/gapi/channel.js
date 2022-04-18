'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const GapiBaseModel = require(__dirname + '/base');
const Channel = require(yt2PluginLibRoot + '/core/entities/channel');

class ChannelModel extends GapiBaseModel {

    getChannels(options = {}) {
        if (options.search) {
            return this.getItems('search', options);
        }
        else {
            return this.getItems('subscriptions', options);
        }
    }

    getChannel(channelId) {
        let defer = libQ.defer();
        let self = this;

        let apiParams = {
            part: 'snippet',
            id: channelId,
            hl: yt2.getConfigValue('language', 'en')
        };

        yt2.getGapiService().then( (service) => {
            yt2.getCache().cacheOrPromise(self.getCacheKeyForFetch('channels', apiParams), () => {
                return service.getResource('channels').list(apiParams);
            }).then( (channels) => {
                if (channels.data.items.length) {
                    let item = channels.data.items[0];
                    let channel = new Channel(item.id, item.snippet.title, self.getThumbnail(item), item.snippet.description);
                    defer.resolve(channel);
                }
                else {
                    defer.resolve(null);
                }
            })
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getApiParams(options) {
        let apiParams = super.getApiParams(options);

        if (options.search) {
            apiParams.type = 'channel';
            apiParams.q = options.search;
            apiParams.regionCode = yt2.getConfigValue('region', 'US');
        }
        else {
            apiParams.mine = true;
        }

        return apiParams;
    }

    convertToEntity(item) {
        let channelId = (item.kind === 'youtube#searchResult') ? item.id.channelId : item.snippet.resourceId.channelId;
        return new Channel(channelId, item.snippet.title, this.getThumbnail(item));
    }

}

module.exports = ChannelModel;