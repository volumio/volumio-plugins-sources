'use strict';

const libQ = require('kew');
const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const UIHelper = require(bandcampPluginLibRoot + '/helper/ui');
const DiscographyViewSupport = require(__dirname + '/discography');

class BandViewHandler extends DiscographyViewSupport {

    browse() {
        let self = this;
        let url = decodeURIComponent(self.getCurrentView().bandUrl);
        let defer = libQ.defer();

        self.getHeader(url).then( (header) => {
            let backToList = null;
            if (header.rawInfo.label) {
                let baseUri = self.getUri();
                let labelLink = {
                    icon: 'fa fa-link',
                };
                // Check if we're coming from the label:
                // label -> artist ; or
                // label -> album -> artist
                let getBackToUri = (labelUrl, matchLevel) => {
                    let prevViews = self.getPreviousViews();
                    let viewToMatch = prevViews[prevViews.length - (matchLevel + 1)];
                    if (viewToMatch && viewToMatch.name === 'band' && decodeURIComponent(viewToMatch.bandUrl) === labelUrl) {
                        return self.constructUriFromViews(prevViews.slice(0, prevViews.length - matchLevel));
                    }
                    return null;
                }

                let backToUri = getBackToUri(header.rawInfo.label.url, 0) || getBackToUri(header.rawInfo.label.url, 1);
                if (backToUri) {
                    labelLink.title = bandcamp.getI18n('BANDCAMP_BACK_TO', header.rawInfo.label.name);
                    labelLink.uri = backToUri;
                }
                else {
                    labelLink.title = header.rawInfo.label.name,
                    labelLink.uri =  baseUri + '/band@bandUrl=' + encodeURIComponent(header.rawInfo.label.url)
                }
                backToList = {
                    availableListViews: ['list'],
                    items: [labelLink]
                };
            }

            let bandType = header.rawInfo.type;
            let getList;
            switch(bandType) {
                case 'artist':
                    getList = self.getListsForArtist(url);
                    break;
                case 'label':
                    getList = self.getListsForLabel(url);
                    break;
                default:
                    getList = Promise.resolve([]);
            }
            getList.then((lists) => {
                if (backToList) {
                    lists.unshift(backToList);
                }
                let link = {
                    url,
                    text: self.getViewLinkText(bandType),
                    icon: { type: 'bandcamp' },
                    target: '_blank'
                };
                if (lists.length > 1) {
                    lists[1].title = UIHelper.constructListTitleWithLink(lists[1].title, link, false);
                }
                else {
                    lists[0].title = UIHelper.constructListTitleWithLink(lists[0].title, link, true);
                }
    
                let nav = {
                    prev: {
                        uri: self.constructPrevUri()
                    },
                    info: header,
                    lists
                };
    
                defer.resolve({
                    navigation: nav
                });
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getHeader(url) {
        let self = this;
        let defer = libQ.defer();

        self.getModel('band').getBand(url).then( (info) => {
            let header = self.getParser('band').parseToHeader(info);
            header.rawInfo = info;
            defer.resolve(header);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getListsForArtist(url) {
        let defer = libQ.defer();

        this.getDiscographyList(url).then( (list) => {
            defer.resolve([list]);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getListsForLabel(url) {
        let self = this;
        let defer = libQ.defer();
        let viewType = self.getCurrentView().view;
        let getList = viewType === 'artists' ? self.getLabelArtistsList(url) : self.getDiscographyList(url);
        
        getList.then( (list) => {
            let baseUri = self.getUri();
            let viewLink = {};
            if (viewType === 'artists') {
                viewLink.icon = 'fa fa-music';
                viewLink.title = bandcamp.getI18n('BANDCAMP_DISCOGRAPHY');
                viewLink.uri = baseUri + '/band@bandUrl=' + encodeURIComponent(url) + '@view=discography';
            }
            else {
                viewLink.icon = 'fa fa-users';
                viewLink.title = bandcamp.getI18n('BANDCAMP_LABEL_ARTISTS');
                viewLink.uri = baseUri + '/band@bandUrl=' + encodeURIComponent(url) + '@view=artists';
            }
            let links = {
                availableListViews: ['list'],
                items: [viewLink]
            };
            defer.resolve([links, list]);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getLabelArtistsList(url) {
        let self = this;
        let defer = libQ.defer();
        
        let view = self.getCurrentView();
        let model = self.getModel('band');
        let parser = self.getParser('band');

        let options = {
            limit: bandcamp.getConfigValue('itemsPerPage', 47),
            labelUrl: url
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }
       
        model.getBands(options).then( (artists) => {
            let items = [];
            artists.items.forEach( (artist) => {
                items.push(parser.parseToListItem(artist));
            });
            let nextPageRef = self.constructPageRef(artists.nextPageToken, artists.nextPageOffset);
            if (nextPageRef) {
                let nextUri = self.constructNextUri(nextPageRef);
                items.push(self.constructNextPageItem(nextUri));
            }

            defer.resolve({
                title: bandcamp.getI18n('BANDCAMP_LABEL_ARTISTS'),
                availableListViews: ['list', 'grid'],
                items: items
            });

        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    getViewLinkText(bandType) {
        switch(bandType) {
            case 'artist':
                return bandcamp.getI18n('BANDCAMP_VIEW_LINK_ARTIST');
            case 'label':
                return bandcamp.getI18n('BANDCAMP_VIEW_LINK_LABEL');
            default:
                return '';
        }
    }

    getTracksOnExplode() {
        let self = this;
        let defer = libQ.defer();

        let url = self.getCurrentView().bandUrl;
        if (!url) {
            return libQ.reject("Invalid url");
        }

        let model = self.getModel('discography');
        let options = {
            limit: 1,
            artistOrLabelUrl: decodeURIComponent(url)
        };
        model.getDiscography(options).then( (results) => {
            let first = results.items[0] || {};
            if (first.type === 'track') {
                let trackModel = self.getModel('track');
                return trackModel.getTrack(first.url);
            }
            else if (first.type === 'album') {
                let albumModel = self.getModel('album');
                return albumModel.getAlbum(first.url).then( (album) => {
                    return album.tracks;
                })
            }
            else {
                return [];
            }
        }).then( (tracks) => {
            defer.resolve(tracks);
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }
}

module.exports = BandViewHandler;