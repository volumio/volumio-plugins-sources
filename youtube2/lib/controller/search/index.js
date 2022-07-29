'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ViewHandlerFactory = require(yt2PluginLibRoot + '/controller/browse/view-handlers/factory');

class SearchController {

    search(query) {
        let self = this;
        let defer = libQ.defer();
        
        let safeQuery = encodeURIComponent(query.value.replace(/"/g, '\\"'));
        let searchChannelsUri = `youtube2/channels@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(yt2.getI18n('YOUTUBE2_LIST_TITLE_CHANNELS_MATCHING', query.value))}`;
        let searchPlaylistsUri = `youtube2/playlists@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(yt2.getI18n('YOUTUBE2_LIST_TITLE_PLAYLISTS_MATCHING', query.value))}`;
        let searchVideosUri = `youtube2/videos@search=${safeQuery}@combinedSearch=1@title=${encodeURIComponent(yt2.getI18n('YOUTUBE2_LIST_TITLE_VIDEOS_MATCHING', query.value))}`;

        let searches = [
            self.doSearch(searchChannelsUri, 'channels'),
            self.doSearch(searchPlaylistsUri, 'playlists'),
            self.doSearch(searchVideosUri, 'videos')
        ];

        libQ.all(searches).then( (results) => {
            let lists = [];
            results.forEach( (result) => {
                if (result) {
                    let navList = result.navigation.lists[0];
                    switch(result.type) {
                        case 'channels':
                            navList.title = yt2.getI18n('YOUTUBE2_LIST_TITLE_SEARCH_RESULTS_CHANNELS');
                            break;
                        case 'playlists':
                            navList.title = yt2.getI18n('YOUTUBE2_LIST_TITLE_SEARCH_RESULTS_PLAYLISTS');
                            break;
                        case 'videos':
                            navList.title = yt2.getI18n('YOUTUBE2_LIST_TITLE_SEARCH_RESULTS_VIDEOS');
                            break;
                        default:
                            navList.title = 'YouTube';
                    }
                    lists.push(navList);
                }
            });
            defer.resolve(lists);
        }).fail( (error) => {
            yt2.getLogger().error('[youtube2-search] search() error:');
            yt2.getLogger().error(error);
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
            yt2.getLogger().error(error);
            defer.resolve(null);
        });

        return defer.promise;
    }

}

module.exports = SearchController;