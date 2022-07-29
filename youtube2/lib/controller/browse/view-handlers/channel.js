'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BaseViewHandler = require(__dirname + '/base');

class ChannelViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri(); 
        let view = self.getCurrentView();      
        let model = self.getModel('channel');
        let parser = self.getParser('channel');

        let options = {};

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.search) {
            options.search = decodeURIComponent(view.search);
        }
        
        if (view.search && view.combinedSearch) {
            options.limit = yt2.getConfigValue('combinedSearchResults', 11);
        }
        else {
            options.limit = yt2.getConfigValue('itemsPerPage', 47);
        }

        model.getChannels(options).then( (channels) => {
            let items = [];
            channels.items.forEach( (channel) => {
                items.push(parser.parseToListItem(channel));
            });
            let nextPageRef = self.constructPageRef(channels.nextPageToken, channels.nextPageOffset);
            if (nextPageRef) {
                let nextUri = self.constructNextUri(nextPageRef);
                items.push(self.constructNextPageItem(nextUri));
            }
            defer.resolve({
                navigation: {
                    prev: {
                        uri: prevUri
                    },
                    lists: [
                        {
                            title: view.title ? decodeURIComponent(view.title) : yt2.getI18n('YOUTUBE2_LIST_TITLE_CHANNELS'),
                            availableListViews: ['list', 'grid'],
                            items: items
                        }
                    ]
                }
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

}

module.exports = ChannelViewHandler;