'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const ExplodableViewHandler = require(__dirname + '/explodable');

class PlaylistViewHandler extends ExplodableViewHandler {

    browse() {
        let self = this;
        let view = self.getCurrentView();

        if (self._getBrowseSingleTargetId(view)) {
            return self._browseSingle();
        }

        let defer = libQ.defer();
        let prevUri = self.constructPrevUri();       
        let model = self.getModel(self._getEntityName());
        let parser = self.getParser(self._getEntityName());

        let options = {};

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.search) {
            options.search = decodeURIComponent(view.search);
        }
        else if (view.userId) {
            options.userId = view.userId;
        }
        else {
            return libQ.reject('Unknown criteria');
        }

        if (view.search && view.combinedSearch) {
            options.limit = sc.getConfigValue('combinedSearchResults', 11);
        }
        else if (view.inSection) {
            options.limit = sc.getConfigValue('itemsPerSection', 11);
        }
        else {
            options.limit = sc.getConfigValue('itemsPerPage', 47);
        }

        model[self._getModelFetchFunctionName(false)](options).then( (results) => {
            let items = [];
            results.items.forEach( (result) => {
                items.push(parser.parseToListItem(result));
            });
            let nextPageRef = self.constructPageRef(results.nextPageToken, results.nextPageOffset);
            if (nextPageRef) {
                let nextUri = self.constructNextUri(nextPageRef);
                items.push(self.constructNextPageItem(nextUri));
            }
            return {
                prev: {
                    uri: prevUri
                },
                lists: [
                    {
                        title: view.title ? decodeURIComponent(view.title) : self._getBrowseMultipleListTitle(),
                        availableListViews: ['list', 'grid'],
                        items: items
                    }
                ]
            };
        }).then( (nav) => {
            let header, headerParser;
            if (view.userId && !view.inSection) {
                let userModel = self.getModel('user');
                header = userModel.getUser(view.userId);
                headerParser = self.getParser('user');
            }

            if (header) {
                let headerDefer = libQ.defer();

                header.then( (headerInfo) => {
                    nav.info = headerParser.parseToHeader(headerInfo);
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
            defer.reject(error);
        });

        return defer.promise;
    }

    _getEntityName() {
        return 'playlist';
    }

    _getModelFetchFunctionName(browseSingle) {
        if (browseSingle) {
            return 'getPlaylist';
        }
        else {
            return 'getPlaylists';
        }
    }

    _getBrowseMultipleListTitle() {
        return sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS');
    }

    _getBrowseSingleTargetId(view) {
        return view.playlistId;
    }

    _getVisitLinkText() {
        return sc.getI18n('SOUNDCLOUD_VISIT_LINK_PLAYLIST');
    }

    _browseSingle() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();      
        let model = self.getModel(self._getEntityName());
        let entityParser = self.getParser(self._getEntityName());
        let trackParser = self.getParser('track');

        let options = {
            loadTracks: true
        };
        
        if (view.type === 'system') {
            options.type = 'system';
        }

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.tracksOffset = ref.pageToken;
        }

        let loadAllTracks = sc.getConfigValue('loadFullPlaylistAlbum', false);
        if (!loadAllTracks) {
            options.tracksLimit = sc.getConfigValue('itemsPerPage', 47);
        }

        model[self._getModelFetchFunctionName(true)](self._getBrowseSingleTargetId(view), options).then( (entity) => {
            
            let items = [];
            entity.tracks.forEach( (track) => {
                items.push(trackParser.parseToListItem(track));
            });
            if (!loadAllTracks) {
                let nextOffset = (options.tracksOffset || 0) + options.tracksLimit;
                if (entity.trackCount > nextOffset) {
                    let nextPageRef = self.constructPageRef(nextOffset, 0);
                    if (nextPageRef) {
                        let nextUri = self.constructNextUri(nextPageRef);
                        items.push(self.constructNextPageItem(nextUri));
                    }
                }
            }

            let listTitle = view.title ? decodeURIComponent(view.title) : sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS');
            if (entity.permalink) {
                listTitle = self.addLinkToListTitle(listTitle, entity.permalink, self._getVisitLinkText());
            }

            let nav = {
                prev: {
                    uri: prevUri
                },
                info: entityParser.parseToHeader(entity),
                lists: [
                    {
                        title: listTitle,
                        availableListViews: ['list', 'grid'],
                        items: items
                    }
                ]
            };

            defer.resolve({
                navigation: nav
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }


    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!self._getBrowseSingleTargetId(view)) {
            return libQ.reject("Operation not supported");
        }

        let defer = libQ.defer();
        let model = self.getModel(self._getEntityName());
        
        let options = {
            loadTracks: true
        };
        
        if (view.type === 'system') {
            options.type = 'system';
        }
        
        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.tracksOffset = ref.pageToken;
        }
        options.tracksLimit = sc.getConfigValue('itemsPerPage', 47);

        model[self._getModelFetchFunctionName(true)](self._getBrowseSingleTargetId(view), options).then( (entity) => {
            defer.resolve(entity.tracks);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

}

module.exports = PlaylistViewHandler;