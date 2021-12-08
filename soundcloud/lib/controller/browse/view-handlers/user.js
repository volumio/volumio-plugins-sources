'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const ExplodableViewHandler = require(__dirname + '/explodable');

class UserViewHandler extends ExplodableViewHandler {

    browse() {
        let self = this;
        let view = self.getCurrentView();

        if (view.userId) {
            return self._browseSingle();
        }

        let defer = libQ.defer();
        let prevUri = self.constructPrevUri(); 
        let model = self.getModel('user');
        let parser = self.getParser('user');

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
            options.limit = sc.getConfigValue('combinedSearchResults', 11);
        }
        else {
            options.limit = sc.getConfigValue('itemsPerPage', 47);
        }

        model.getUsers(options).then( (users) => {
            let items = [];
            users.items.forEach( (user) => {
                items.push(parser.parseToListItem(user));
            });
            let nextPageRef = self.constructPageRef(users.nextPageToken, users.nextPageOffset);
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
                            title: view.title ? decodeURIComponent(view.title) : sc.getI18n('SOUNDCLOUD_LIST_TITLE_USERS'),
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

    _browseSingle() {
        let self = this;
        let defer = libQ.defer();
        let view = self.getCurrentView();
        let userId = view.userId;
        let currentUri = self.getUri();
        let prevUri = self.constructPrevUri();
        
        let albumsUri = `${currentUri}/albums@userId=${userId}@inSection=1@title=${encodeURIComponent(sc.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS'))}`;
        let playlistsUri = `${currentUri}/playlists@userId=${userId}@inSection=1@title=${encodeURIComponent(sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS'))}`;
        let tracksUri = `${currentUri}/tracks@userId=${userId}@inSection=1@title=${encodeURIComponent(sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS'))}`;

        let fetches = [
            self._doFetch(albumsUri),
            self._doFetch(playlistsUri),
            self._doFetch(tracksUri)
        ];

        libQ.all(fetches).then( (results) => {
            let lists = [];
            results.forEach( (result) => {
                if (result) {
                    let navList = result.navigation.lists[0];
                    lists.push(navList);
                }
            });
            return {
                prev: {
                    uri: prevUri
                },
                lists: lists
            };
        }).then( (nav) => {
            let header, headerParser;
            if (view.userId) {
                let userModel = self.getModel('user');
                header = userModel.getUser(view.userId);
                headerParser = self.getParser('user');
            }

            if (header) {
                let headerDefer = libQ.defer();

                header.then( (headerInfo) => {
                    nav.info = headerParser.parseToHeader(headerInfo);
                    if (headerInfo.permalink && nav.lists.length > 0) {
                        let listTitle = nav.lists[0].title;
                        listTitle = self.addLinkToListTitle(listTitle, headerInfo.permalink, sc.getI18n('SOUNDCLOUD_VISIT_LINK_USER', headerInfo.username));
                        nav.lists[0].title = listTitle;
                    }
                }).fin( () => {
                    headerDefer.resolve(nav);
                });

                return headerDefer.promise;
            }
            else {
                return nav;
            }
        }).then( (nav) => {
            defer.resolve({
                navigation: nav
            });
        }).fail( (error) => {
            sc.getLogger().error('[soundcloud-view.user] _browseSingle() error:');
            sc.getLogger().error(error);
            defer.reject(error);
        });

        return defer.promise;
    }

    _doFetch(uri) {
        let defer = libQ.defer();
        require(scPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(uri).then( (handler) => {
            return handler.browse();
        }).then( (result) => {
            if (result.navigation.lists.length && result.navigation.lists[0].items.length) {
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

    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!view.userId) {
            return libQ.reject("Operation not supported");
        }

        let defer = libQ.defer();
        let model = self.getModel('track');
        
        let options = {
            limit: sc.getConfigValue('itemsPerPage', 47),
            userId: view.userId
        };
        
        model.getTracks(options).then( (tracks) => {
            defer.resolve(tracks.items);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

}

module.exports = UserViewHandler;