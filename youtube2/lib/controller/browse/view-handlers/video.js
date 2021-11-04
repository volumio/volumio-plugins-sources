'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const ExplodableViewHandler = require(__dirname + '/explodable');

class VideoViewHandler extends ExplodableViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('video');
        let parser = self.getParser('video');

        let options = {};

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.search) {
            options.search = decodeURIComponent(view.search);
        }
        else if (view.playlistId) {
            options.playlistId = view.playlistId;
        }
        else {
            options.myRating = 'like';
        }

        if (view.search && view.combinedSearch) {
            options.limit = yt2.getConfigValue('combinedSearchResults', 11);
        }
        else {
            options.limit = yt2.getConfigValue('itemsPerPage', 47);
        }

        model.getVideos(options).then( (videos) => {
            let items = [];
            videos.items.forEach( (video) => {
                items.push(parser.parseToListItem(video));
            });
            let nextPageRef = self.constructPageRef(videos.nextPageToken, videos.nextPageOffset);
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
                        title: view.title ? decodeURIComponent(view.title) : yt2.getI18n('YOUTUBE2_LIST_TITLE_VIDEOS'),
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
        let model = self.getModel('video');

        if (view.name === 'video') {
            return model.getVideo(view.videoId);
        }
        else if (view.name === 'videos') {
            let defer = libQ.defer();

            let options = {
                limit: yt2.getConfigValue('itemsPerPage', 47)
            };
    
            if (view.pageRef) {
                let ref = self.parsePageRef(view.pageRef);
                options.pageToken = ref.pageToken;
                options.pageOffset = ref.pageOffset;
            }
    
            if (view.search) {
                options.search = decodeURIComponent(view.search);
            }
            else if (view.playlistId) {
                options.playlistId = view.playlistId;
            }
            else {
                options.myRating = 'like';
            }

            model.getVideos(options).then( (videos) => {
                defer.resolve(videos.items);
            }).fail( (error) => {
                defer.reject(error);
            });

            return defer.promise;
        }
        else {
            // Should never reach here, but just in case...
            return libQ.reject('View name is ' + view.name + ' but handler is for video');
        }
    }

}

module.exports = VideoViewHandler;