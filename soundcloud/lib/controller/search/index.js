'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const ViewHandlerFactory = require(scPluginLibRoot + '/controller/browse/view-handlers/factory');

class SearchController {

    search(query) {
        let self = this;
        let defer = libQ.defer();
        
        let safeQuery = encodeURIComponent(query.value.replace(/"/g, '\\"'));
        let searchUsersUri = `soundcloud/users@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(self.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_USERS_MATCHING', query.value)))}`;
        let searchAlbumsUri = `soundcloud/albums@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(self.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS_MATCHING', query.value)))}`;
        let searchPlaylistsUri = `soundcloud/playlists@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(self.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS_MATCHING', query.value)))}`;
        let searchTracksUri = `soundcloud/tracks@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(self.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS_MATCHING', query.value)))}`;

        let searches = [
            self.doSearch(searchUsersUri, 'users'),
            self.doSearch(searchAlbumsUri, 'albums'),
            self.doSearch(searchPlaylistsUri, 'playlists'),
            self.doSearch(searchTracksUri, 'tracks')
        ];

        libQ.all(searches).then( (results) => {
            let lists = [];
            results.forEach( (result) => {
                if (result) {
                    let navList = result.navigation.lists[0];
                    switch(result.type) {
                        case 'users':
                            navList.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_USERS');
                            break;
                        case 'albums':
                            navList.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_ALBUMS');
                            break;
                        case 'playlists':
                            navList.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_PLAYLISTS');
                            break;
                        case 'tracks':
                            navList.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_TRACKS');
                            break;
                        default:
                            navList.title = 'SoundCloud';
                    }
                    navList.title = self.addIcon(navList.title);
                    lists.push(navList);
                }
            });
            defer.resolve(lists);
        }).fail( (error) => {
            sc.getLogger().error('[soundcloud-search] search() error:');
            sc.getLogger().error(error);
            defer.resolve([]);
        });

        return defer.promise;
    }

    doSearch(uri, type) {
        let defer = libQ.defer();

        ViewHandlerFactory.getHandler(uri).then( (handler) => {
            return handler.browse();
        }).then( (result) => {
            if (result.navigation.lists.length && result.navigation.lists[0].items.length) {
                result.type = type;
                defer.resolve(result);
            }
            else {
                defer.resolve(null);
            }
        }).fail( (error) => {
            sc.getLogger().error(error);
            defer.resolve(null);
        });

        return defer.promise;
    }

    addIcon(s) {
        let icon = '<img src="/albumart?sourceicon=' + encodeURIComponent('music_service/soundcloud/assets/images/soundcloud.svg') + '" style="width: 23px; height: 23px; margin-right: 8px; margin-top: -3px;" />';
        return icon + s;
    }

}

module.exports = SearchController;