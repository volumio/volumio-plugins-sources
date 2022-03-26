'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const ExplodableViewHandler = require(__dirname + '/explodable');

class PlaylistViewHandler extends ExplodableViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (view.username) {
            return this._browseUserPlaylists();
        }
    }

    _browseUserPlaylists() {
        let self = this;
        let defer = libQ.defer();
        
        let view = self.getCurrentView();
        let prevUri = self.constructPrevUri();
        let playlistModel = self.getModel('playlist');
        let userModel = self.getModel('user');

        let options = {
            username: decodeURIComponent(view.username),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }
       
        userModel.getUser(options.username).then( user => {
            return playlistModel.getPlaylists(options).then( playlists => {
                let lists;
                if (playlists.items.length > 0) {
                    lists = [self._getPlaylistsList(user, playlists)];
                }
                else {
                    lists = [];
                }
                let nav = {
                    prev: {
                        uri: prevUri
                    },
                    lists
                };
                let userParser = self.getParser('user');
                nav.info = userParser.parseToHeader(user);
    
                defer.resolve({
                    navigation: nav
                });
            });
        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getPlaylistsList(user, playlists) {
        let self = this;
        let parser = self.getParser('playlist');
        let view = self.getCurrentView();
        let items = [];
        playlists.items.forEach( playlist => {
            playlist.owner = user;
            items.push(parser.parseToListItem(playlist));
        });
        let nextPageRef = self.constructPageRef(playlists.nextPageToken, playlists.nextPageOffset);
        if (nextPageRef) {
            let nextUri = self.constructNextUri(nextPageRef);
            items.push(self.constructNextPageItem(nextUri));
        }
        let list = {
            title: mixcloud.getI18n('MIXCLOUD_PLAYLISTS'),
            availableListViews: ['list', 'grid'],
            items
        };

        if (!view.inSection) {
            let backLink = self.constructPrevViewLink(mixcloud.getI18n('MIXCLOUD_BACK_LINK_USER'));
            list.title = UIHelper.constructListTitleWithLink(list.title, backLink, true);
        }

        return list;
    }

    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!view.cloudcastId) {
            return libQ.reject("Operation not supported");
        }

        let model = self.getModel('cloudcast');
        return model.getCloudcast(decodeURIComponent(view.cloudcastId));
    }

}

module.exports = PlaylistViewHandler;