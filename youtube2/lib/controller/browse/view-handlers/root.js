'use strict';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2')
const BaseViewHandler = require(__dirname + '/base');

class RootViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();
      
        let listPromises = [];

        if (yt2.getConfigValue('dataRetrievalMethod', 'scraping') === 'gapi') {
            listPromises.push(self._getMyYouTubeItems('My YouTube'));
        }

        let frontPageSections = yt2.getConfigValue('frontPageSections', [], true);
        frontPageSections.filter( section => section.enabled ).forEach( (section) => {
            listPromises.push(self._getFrontPageSectionItems(section));
        });

        libQ.all(listPromises).then( (lists) => {
            let finalLists = [];
            lists.forEach( (list) => {
                if (list.items.length) {
                    finalLists.push(list);
                }
            });
            defer.resolve({
                navigation: {
                    prev: {
                        uri: '/'
                    },
                    lists: finalLists
                }
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getMyYouTubeItems(title) {
        let baseUri = 'youtube2';
        let baseImgPath = 'music_service/youtube2/assets/images/';
        
        let items = [
                {
                    service: 'youtube2',
                    type: 'myYouTubeItem',
                    title: yt2.getI18n('YOUTUBE2_SUBSCRIBED_CHANNELS'),
                    uri: baseUri + '/channels@title=' + encodeURIComponent(yt2.getI18n('YOUTUBE2_SUBSCRIBED_CHANNELS')),
                    albumart: '/albumart?sourceicon=' + baseImgPath + 'subscription.png'
                },
                {
                    service: 'youtube2',
                    type: 'myYouTubeItem',
                    title: yt2.getI18n('YOUTUBE2_MY_PLAYLISTS'),
                    uri: baseUri + '/playlists@title=' + encodeURIComponent(yt2.getI18n('YOUTUBE2_MY_PLAYLISTS')),
                    albumart: '/albumart?sourceicon=' + baseImgPath + 'playlist.png'
                },
                {
                    service: 'youtube2',
                    type: 'myYouTubeItem',
                    title: yt2.getI18n('YOUTUBE2_LIKED_VIDEOS'),
                    uri: baseUri + '/videos@title=' + encodeURIComponent(yt2.getI18n('YOUTUBE2_LIKED_VIDEOS')),
                    albumart: '/albumart?sourceicon=' + baseImgPath + 'liked.png'
                }
            ];
        
        return libQ.resolve({
            title: title,
            availableListViews: ['list', 'grid'],
            items: items
        });
    }

    _getFrontPageSectionItems(section) {
        let self = this;
    	let defer = libQ.defer();
    	
        let model = self.getModel(section.itemType),
            parser = self.getParser(section.itemType),
            options = {
                limit: section.itemCount,
                search: section.keywords
            };

        let modelFetchPromise;
        switch(section.itemType) {
            case 'channel':
                modelFetchPromise = model.getChannels(options);
                break;
            case 'playlist':
                modelFetchPromise = model.getPlaylists(options);
                break;
            case 'video':
                modelFetchPromise = model.getVideos(options);
                break;
        }
		modelFetchPromise.then( (results) => {
            let items = [];
            results.items.forEach( (result) => {
                items.push(parser.parseToListItem(result));
            });
            let nextPageRef = self.constructPageRef(results.nextPageToken, results.nextPageOffset);
            if (nextPageRef) {
                let nextUri = `youtube2/${section.itemType}s@search=${encodeURIComponent(section.keywords)}@title=${encodeURIComponent(section.title)}`;
                items.push(self.constructNextPageItem(nextUri));
            }
            defer.resolve({
                title: section.title,
                availableListViews: ['list', 'grid'],
            	items: items
            });
        }).fail( (error) => { // return empty list
            yt2.getLogger().error('[youtube2-root] _getFrontPageSectionItems() error:');
            yt2.getLogger().error(error);
			defer.resolve({
				items: [],
			});
		});

		return defer.promise;
    }

}

module.exports = RootViewHandler;