'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud')
const BaseViewHandler = require(__dirname + '/base');

class RootViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();
      
        let fetches = [
            self._getTopFeaturedTracks(),
            self._getMixedSelections()
        ];

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

    _getTopFeaturedTracks() {
        let self = this;
        let defer = libQ.defer();

        let tracksUri = `${self.getUri()}/tracks@topFeatured=1@inSection=1@title=${encodeURIComponent(sc.getI18n('SOUNDCLOUD_LIST_TITLE_TOP_FEATURED_TRACKS'))}`;

        require(scPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(tracksUri).then( (handler) => {
            return handler.browse();
        }).then( (result) => {
            if (result.navigation.lists.length && result.navigation.lists[0].items.length) {
                let list = result.navigation.lists[0];

                list.title = `
                <div style="width: 100%;">
                    <div style="padding-bottom: 8px; border-bottom: 1px solid;">
                        ${list.title}
                    </div>
                </div>`;

                defer.resolve([list]);
            }
            else {
                defer.resolve([]);
            }
        }).fail( (error) => {
            sc.getLogger().error(error);
            defer.resolve([]);
        });

        return defer.promise;
    }

    _getMixedSelections() {
        let self = this;
        let defer = libQ.defer();

        let selectionModel = self.getModel('selection');
        let lists = [];
        selectionModel.getSelections({ mixed: true }).then( (selections) => {
            selections.items.forEach( (selection, index) => {
                if (selection.items.length) {
                    lists.push(self._getListFromSelection(selection, index));
                }
            });
            defer.resolve(lists);
        }).fail( (error) => {
            sc.getLogger().error(error);
            defer.resolve([]);
        });

        return defer.promise;
    }

    _getListFromSelection(selection, index) {
        let parser = this.getParser('playlist');
        let items = [];
        let limit = sc.getConfigValue('itemsPerSection', 11);
        let slice = selection.items.slice(0, limit);
        slice.forEach( (item) => {
            items.push(parser.parseToListItem(item));
        });
        if (limit < selection.items.length) {
            let nextPageRef = this.constructPageRef(limit, 0);
            let nextUri = this.getUri() + `/selections@selectionId=${selection.id}@pageRef=${nextPageRef}`;
            items.push(this.constructNextPageItem(nextUri));
        }
        let listTitle;
        if (index === 0) {
            listTitle = `
                <div style="width: 100%;">
                    <div style="padding-bottom: 8px; border-bottom: 1px solid; margin-bottom: 24px;">
                        ${sc.getI18n('SOUNDCLOUD_TRENDING_PLAYLISTS')}
                    </div>
                    <span style="font-size: 16px; color: #bdbdbd;">${selection.title}</span>
                </div>`;
        }
        else {
            listTitle = `<span style="font-size: 16px; color: #bdbdbd;">${selection.title}</span>`;
        }
        return {
            title: listTitle,
            availableListViews: ['list', 'grid'],
            items: items
        };
    }

/*
    _getRootHeader() {
        let baseUri = this.getUri();

        return {
            'uri': baseUri,
            'service': 'soundcloud',
            'type': 'album',
            'title': sc.getI18n('SOUNDCLOUD_TRENDING_PLAYLISTS'),
            'artist': 'SoundCloud',
            'year': 'https://soundcloud.com',
            'albumart': '/albumart?sourceicon=music_service/soundcloud/assets/images/Antu_soundcloud.svg'
        };
    }*/
}

module.exports = RootViewHandler;