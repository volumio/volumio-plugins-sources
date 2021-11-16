'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const ExplodableViewHandler = require(__dirname + '/explodable');

class TrackViewHandler extends ExplodableViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('track');
        let parser = self.getParser('track');

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
        else if (view.topFeatured) {
            options.topFeatured = view.topFeatured;
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

        model.getTracks(options).then( (tracks) => {
            let items = [];
            tracks.items.forEach( (track) => {
                items.push(parser.parseToListItem(track));
            });
            let nextPageRef = self.constructPageRef(tracks.nextPageToken, tracks.nextPageOffset);
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
                        title: view.title ? decodeURIComponent(view.title) : sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS'),
                        availableListViews: ['list', 'grid'],
                        items: items
                    }
                ]
            };
        }).then( (nav) => {
            let header, headerParser;
            if (view.playlistId) {
                let playlistModel = self.getModel('playlist');
                header = playlistModel.getPlaylist(view.playlistId);
                headerParser = self.getParser('playlist');
            }
            else if (view.albumId) {
                let albumModel = self.getModel('album');
                header = albumModel.getAlbum(view.albumId);
                headerParser = self.getParser('album');
            }
            else if (view.userId && !view.inSection) {
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

    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        let model = self.getModel('track');

        if (view.name === 'track') {
            return model.getTrack(view.trackId);
        }
        /*else if (view.name === 'tracks') {
            let defer = libQ.defer();

            let options = {
                limit: sc.getConfigValue('itemsPerPage', 47)
            };
    
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
            else if (view.topFeatured) {
                options.topFeatured = true;
            }
            else {
                return libQ.reject('Unknown criteria');
            }

            model.getTracks(options).then( (tracks) => {
                defer.resolve(tracks.items);
            }).fail( (error) => {
                defer.reject(error);
            });

            return defer.promise;
        }*/
        else {
            // Should never reach here, but just in case...
            return libQ.reject('View name is ' + view.name + ' but handler is for track');
        }
    }

}

module.exports = TrackViewHandler;