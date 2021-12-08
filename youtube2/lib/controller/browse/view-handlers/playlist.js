'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ExplodableViewHandler = require(__dirname + '/explodable');

class PlaylistViewHandler extends ExplodableViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();      
        let model = self.getModel('playlist');
        let parser = self.getParser('playlist');

        let options = {};

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.search) {
            options.search = decodeURIComponent(view.search);
        }
        else if (view.channelId) {
            options.channelId = view.channelId;
        }
        else {
            options.mine = true;
        }

        if (view.search && view.combinedSearch) {
            options.limit = yt2.getConfigValue('combinedSearchResults', 11);
        }
        else {
            options.limit = yt2.getConfigValue('itemsPerPage', 47);
        }

        model.getPlaylists(options).then( (playlists) => {
            let items = [];
            playlists.items.forEach( (playlist) => {
                items.push(parser.parseToListItem(playlist));
            });
            let nextPageRef = self.constructPageRef(playlists.nextPageToken, playlists.nextPageOffset);
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
                        title: view.title ? decodeURIComponent(view.title) : yt2.getI18n('YOUTUBE2_LIST_TITLE_PLAYLISTS'),
                        availableListViews: ['list', 'grid'],
                        items: items
                    }
                ]
            };
        }).then( (nav) => {
            let header, headerParser;
            if (view.channelId) {
                let channelModel = self.getModel('channel');
                header = channelModel.getChannel(view.channelId);
                headerParser = self.getParser('channel');
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

    getVideosOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!view.channelId) {
            return libQ.reject("Operation not supported");
        }

        let defer = libQ.defer();
        let playlistModel = self.getModel('playlist');
        let videoModel = self.getModel('video');
        let limit = yt2.getConfigValue('itemsPerPage', 47)
        let options = {
            channelId: view.channelId,
            limit: limit
        };
        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        playlistModel.getPlaylists(options).then( (playlists) => {
            self._getVideosFromPlaylists(playlists.items, limit, videoModel, defer);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getVideosFromPlaylists(playlists, limit, model, defer, currentList = [], currentIndex = 0) {
        let self = this;

        if (playlists.length > currentIndex) {
            let options = {
                playlistId: playlists[currentIndex].id,
                limit: limit - currentList.length
            };
            model.getVideos(options).then( (videos) => {
                // Add playlistId to each video for goto(album)
                videos.items.forEach( video => {
                    video.fromPlaylistId = options.playlistId;
                });
                currentList = currentList.concat(videos.items);
                if (currentList.length >= limit || currentIndex === playlists.length - 1) {
                    defer.resolve(currentList);
                }
                else {
                    self._getVideosFromPlaylists(playlists, limit, model, defer, currentList, currentIndex + 1);
                }
            }).fail( (error) => {
                defer.reject(error);
            });
        }
        else {
            defer.resolve(currentList);
        }
    }

}

module.exports = PlaylistViewHandler;