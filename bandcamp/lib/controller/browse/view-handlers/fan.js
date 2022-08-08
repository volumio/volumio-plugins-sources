'use strict';

const libQ = require('kew');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const BaseViewHandler = require(__dirname + '/base');
const UIHelper = require(bandcampPluginLibRoot + '/helper/ui');

class FanViewHandler extends BaseViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (!view.username) {
            return libQ.reject('Invalid request');
        }
        switch(view.view) {
            case 'collection':
            case 'wishlist':
            case 'followingArtistsAndLabels':
            case 'followingGenres':
                return this._browseList();
            default:
                return this._browseSummary();
        }
    }

    _browseList() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();
        let view = self.getCurrentView();
        let model = self.getModel('fan');

        let options = {
            limit: bandcamp.getConfigValue('itemsPerPage', 47),
            username: decodeURIComponent(view.username)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        let getItems;
        switch(view.view) {
            case 'collection':
                getItems = model.getCollection(options);
                break;
            case 'wishlist':
                getItems = model.getWishlist(options);
                break;
            case 'followingArtistsAndLabels':
                getItems = model.getFollowingArtistsAndLabels(options);
                break;
            default: // followingGenres
                getItems = model.getFollowingGenres(options);
                break;
        }
        
        getItems.then( (itemsData) => {
            let albumParser = self.getParser('album');
            let trackParser = self.getParser('track');
            let bandParser = self.getParser('band');
            let tagParser = self.getParser('tag');
            let items = [];
            itemsData.items.forEach( (item) => {
                if (item.type === 'album') {
                    items.push(albumParser.parseToListItem(item));
                }
                else if (item.type === 'track') {
                    items.push(trackParser.parseToListItem(item, true, true));
                }
                else if (view.view === 'followingArtistsAndLabels') {
                    items.push(bandParser.parseToListItem(item));
                }
                else if (view.view === 'followingGenres') {
                    items.push(tagParser.parseToGenreListItem(item));
                }
            });
            let nextPageRef = self.constructPageRef(itemsData.nextPageToken, itemsData.nextPageOffset);
            if (nextPageRef) {
                let nextUri = self.constructNextUri(nextPageRef);
                items.push(self.constructNextPageItem(nextUri));
            }
            return {
                availableListViews: ['list', 'grid'],
                items: items
            };            
        })
        .then( (list) => {
            return model.getInfo(view.username).then( (fanInfo) => {
                list.title = self._getTitle(fanInfo);
                return list;
            });
        })
        .then( (list) => {
            let nav = {
                prev: {
                    uri: prevUri
                },
                lists: [list]
            };
            defer.resolve({
                navigation: nav
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }
    
    _browseSummary() {
        let self = this;
        let defer = libQ.defer();
        
        let baseUri = self.getUri();
        let prevUri = self.constructPrevUri();
        let username = decodeURIComponent(self.getCurrentView().username);
        let model = self.getModel('fan');
        let baseImgPath = 'music_service/mpd/'

        model.getInfo(username).then( (fanInfo) => {
            let items = [
                {
                    'service': 'bandcamp',
                    'type': 'bandcampFanFolder',
                    'title': bandcamp.getI18n('BANDCAMP_COLLECTION', fanInfo.collectionItemCount),
                    'albumart': '/albumart?sourceicon=' + baseImgPath + 'musiclibraryicon.png',
                    'uri': baseUri + '/fan@username=' + encodeURIComponent(username) + '@view=collection'
                },
                {
                    'service': 'bandcamp',
                    'type': 'bandcampFanFolder',
                    'title': bandcamp.getI18n('BANDCAMP_WISHLIST', fanInfo.wishlistItemCount),
                    'albumart': '/albumart?sourceicon=' + baseImgPath + 'favouritesicon.png',
                    'uri': baseUri + '/fan@username=' + encodeURIComponent(username) + '@view=wishlist'
                },
                {
                    'service': 'bandcamp',
                    'type': 'bandcampFanFolder',
                    'title': bandcamp.getI18n('BANDCAMP_FOLLOWING_ARTISTS_AND_LABELS', fanInfo.followingArtistsAndLabelsCount),
                    'albumart': '/albumart?sourceicon=' + baseImgPath + 'artisticon.png"',
                    'uri': baseUri + '/fan@username=' + encodeURIComponent(username) + '@view=followingArtistsAndLabels'
                },
                {
                    'service': 'bandcamp',
                    'type': 'bandcampFanFolder',
                    'title': bandcamp.getI18n('BANDCAMP_FOLLOWING_GENRES', fanInfo.followingGenresCount),
                    'albumart': '/albumart?sourceicon=' + baseImgPath + 'genreicon.png"',
                    'uri': baseUri + '/fan@username=' + encodeURIComponent(username) + '@view=followingGenres'
                }
            ];
            return {
                title: self._getTitle(fanInfo),
                availableListViews: ['list', 'grid'],
                items: items
            };            
        })
        .then( (list) => {
            let nav = {
                prev: {
                    uri: prevUri
                },
                lists: [list]
            };
            defer.resolve({
                navigation: nav
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getTitle(fanInfo) {
        let view = this.getCurrentView();
        let viewProfileLink = {
            url: fanInfo.url,
            text: bandcamp.getI18n('BANDCAMP_VIEW_LINK_MY_PROFILE'),
            icon: { type: 'fa', class: 'fa fa-user' },
            target: '_blank'
        };
        let titleKey;
        switch(view.view) {
            case 'collection':
                titleKey = 'BANDCAMP_MY_COLLECTION';
                break;
            case 'wishlist':
                titleKey = 'BANDCAMP_MY_WISHLIST';
                break;
            case 'followingArtistsAndLabels':
                titleKey = 'BANDCAMP_MY_FOLLOWING_ARTISTS_AND_LABELS';
                break;
            case 'followingGenres':
                titleKey = 'BANDCAMP_MY_FOLLOWING_GENRES'
                break;
            default:
                titleKey = 'BANDCAMP_MY_BANDCAMP';
        }
        let mainTitle = bandcamp.getI18n(titleKey);
        let secondaryTitle = fanInfo.location ? 
            bandcamp.getI18n('BANDCAMP_MY_BANDCAMP_NAME_LOCATION', fanInfo.name, fanInfo.location) :
            fanInfo.name;

        return UIHelper.constructDoubleLineTitleWithImageAndLink({
            imgSrc: fanInfo.imageUrl,
            mainTitle,
            secondaryTitle,
            link: viewProfileLink
        });
    }
}

module.exports = FanViewHandler;