'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const BaseViewHandler = require(__dirname + '/base');

class RootViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();
      
        let fetches = [
            self._getCategories(),
            self._getFeatured(),
        ];

        libQ.all(fetches).then( results => {
            let lists = [];
            results.forEach( result => {
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
        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getCategories() {
        let self = this;
        let defer = libQ.defer();

        let model = self.getModel('discover');
        let parser = self.getParser('slugItem');
        model.getCategories().then( categories => {
            let lists = [];
            let sections = Object.keys(categories);
            sections.forEach( sectionName => {
                let items = [];
                categories[sectionName].forEach( category => {
                    items.push(parser.parseToListItem(category));
                });
                let title = mixcloud.getI18n('MIXCLOUD_DISCOVER_SHOWS', sectionName);
                title = UIHelper.styleText(title, UIHelper.STYLES.TITLE_CASE);
                title = UIHelper.addMixcloudIconToListTitle(title);
                lists.push({
                    title,
                    availableListViews: ['list', 'grid'],
                    items
                });
            });
            defer.resolve(lists);
        }).fail( error => {
            mixcloud.getLogger().error(error);
            defer.resolve([]);
        });
        
        return defer.promise;
    }

    _getFeatured() {
        let defer = libQ.defer();
        let uri = `${this.getUri()}/featured@inSection=1`;
        require(mixcloudPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(uri).browse()
            .then( result => {
                defer.resolve(result.navigation.lists);
            }).fail( error => {
                mixcloud.getLogger().error(error);
                defer.resolve([]);
            });

        return defer.promise;
    }

}

module.exports = RootViewHandler;