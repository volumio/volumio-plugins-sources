'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const BaseViewHandler = require(__dirname + '/base');

class TagViewHandler extends BaseViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (view.keywords) {
            return this._browseSearchResults();
        }
    }

    _browseSearchResults() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('tag');
        let options = {
            keywords: decodeURIComponent(view.keywords),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        model.getTags(options).then( tags => {
            return [self._getTagsList(tags)];
        }).then( lists => {
            let nav = {
                prev: {
                    uri: prevUri
                },
                lists
            };

            defer.resolve({
                navigation: nav
            });

        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getTagsList(tags) {
        let self = this;
        let view = this.getCurrentView();
        let parser = self.getParser('slugItem');
        let items = [];
        tags.items.forEach( tag => {
            items.push(parser.parseToListItem(tag));
        });
        let nextPageRef = self.constructPageRef(tags.nextPageToken, tags.nextPageOffset);
        if (nextPageRef) {
            let nextUri = self.constructNextUri(nextPageRef);
            items.push(self.constructNextPageItem(nextUri));
        }
        
        let title;
        if (view.inSection) {
            title = mixcloud.getI18n('MIXCLOUD_TAGS');
        }
        else {
            title = mixcloud.getI18n('MIXCLOUD_TAGS_MATCHING', decodeURIComponent(view.keywords));
        }

        return {
            title: UIHelper.addMixcloudIconToListTitle(title),
            availableListViews: ['list', 'grid'],
            items
        };
    }
}

module.exports = TagViewHandler;