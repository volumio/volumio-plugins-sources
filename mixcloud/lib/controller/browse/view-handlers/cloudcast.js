'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const ExplodableViewHandler = require(__dirname + '/explodable');

const USER_SHOWS_OPTION_ICONS = {
    orderBy: 'fa fa-sort',
};

const SEARCH_OPTION_ICONS = {
    dateUploaded: 'fa fa-calendar',
};

class CloudcastViewHandler extends ExplodableViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (view.cloudcastId) {
            return this._browseCloudcast();
        }
        else if (view.username) {
            if (view.select) {
                return this._browseUserShowsOptions();
            }
            else {
                return this._browseUserShows();
            }
        }
        else if (view.playlistId) {
            return this._browsePlaylistItems();
        }
        else if (view.keywords) {
            if (view.select) {
                return this._browseSearchOptions();
            }
            else {
                return this._browseSearchResults();
            }
        }
    }

    _browseCloudcast() {
        let self = this;
        let defer = libQ.defer();
        
        let view = self.getCurrentView();
        let prevUri = self.constructPrevUri();
        let model = self.getModel('cloudcast');
        let parser = self.getParser('cloudcast');
        let cloudcastId = decodeURIComponent(view.cloudcastId);
        
        model.getCloudcast(cloudcastId).then( cloudcast => {
            let playShowItem = parser.parseToListItem(cloudcast, 'playShowItem');
            let moreFromUserItem = {
                service: 'mixcloud',
                type: 'mixcloudMoreFromItem',
                title: mixcloud.getI18n('MIXCLOUD_MORE_FROM', cloudcast.owner.name),
                icon: 'fa fa-arrow-right',
                uri: self.getUri() + '/user@username=' + encodeURIComponent(cloudcast.owner.username) + '@noExplode=1'
            };

            let lists = [];
            lists.push({
                availableListViews: ['list'],
                items: [playShowItem]
            });
            if (view.showMoreFromUser) {
                lists.push({
                    availableListViews: ['list'],
                    items: [moreFromUserItem]
                });
            }
            let link = {
                url: cloudcast.url,
                text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_SHOW'),
                icon: { type: 'mixcloud' },
                style: UIHelper.STYLES.VIEW_LINK,
                target: '_blank'
            };
            let title = UIHelper.constructListTitleWithLink('', link, true);
            if (cloudcast.description) {
                title += UIHelper.wrapInDiv(cloudcast.description, UIHelper.STYLES.DESCRIPTION);
            }
            if (cloudcast.description) {
                title = UIHelper.wrapInDiv(title, 'width: 100%;');
            }
            else {
                title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
            }
            lists[0].title = title;

            let nav = {
                prev: {
                    uri: prevUri
                },
                info: parser.parseToHeader(cloudcast),
                lists
            };

            defer.resolve({
                navigation: nav
            });

        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _browseUserShows() {
        let self = this;
        let defer = libQ.defer();
        
        let view = self.getCurrentView();
        let prevUri = self.constructPrevUri();
        let userModel = self.getModel('user');
        let cloudcastModel = self.getModel('cloudcast');

        let options = {
            username: decodeURIComponent(view.username),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.orderBy !== undefined) {
            options.orderBy = view.orderBy;
        }

        userModel.getUser(options.username).then( user => {
            return cloudcastModel.getCloudcasts(options).then( cloudcasts => {
                let showsOptions = userModel.getShowsOptions();
                let params = { orderBy: cloudcasts.params.orderBy };
                let lists = [];
                if (cloudcasts.items.length > 0) {
                    lists.push(self._getUserShowsParamsList(params, showsOptions));
                    lists.push(self._getCloudcastsList(cloudcasts));
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

    _getUserShowsParamsList(params, showsOptions) {
        let self = this;
        let baseUri = self.constructUriWithParams(params);
        let view = self.getCurrentView();
        let items = [];

        let _constructShowsOptionItem = (o, title) => {
            return {
                service: 'mixcloud',
                type: 'mixcloudOption',
                title,
                icon: USER_SHOWS_OPTION_ICONS[o],
                uri: baseUri + '@select=' + o
            }
        }

        ['orderBy'].forEach( o => {
            let paramValue = params[o];
            if (paramValue !== undefined) {
                let optArr = showsOptions[o] || [];
                if (optArr.length) {
                    let opt = optArr.find( o => o.value == paramValue );
                    let title = opt ? opt.name : optArr[0].name;
                    if (o === 'orderBy') {
                        title = mixcloud.getI18n(`MIXCLOUD_ORDER_BY_${title.toUpperCase()}`);
                    }
                    items.push(_constructShowsOptionItem(o, title));
                }
            }
        });

        let list = {
            title: mixcloud.getI18n('MIXCLOUD_SHOWS'),
            availableListViews: ['list'],
            items
        };

        if (!view.inSection) {
            let backLink = self.constructPrevViewLink(mixcloud.getI18n('MIXCLOUD_BACK_LINK_USER'));
            list.title = UIHelper.constructListTitleWithLink(list.title, backLink, true);
        }

        return list;
    }

    _browseUserShowsOptions() {
        let self = this;

        let prevUri = self.constructPrevUri();
        let view = self.getCurrentView();
        let model = self.getModel('user');

        let showsOptions = model.getShowsOptions();

        let optArr = showsOptions[view.select] || [];
        let items = [];
        optArr.forEach( opt => {
            let isSelected = opt.value == view[view.select];
            let title = opt.name;
            if (view.select === 'orderBy') {
                title = mixcloud.getI18n(`MIXCLOUD_ORDER_BY_${title.toUpperCase()}`);
            }
            if (isSelected) {
                title = UIHelper.styleText(title, UIHelper.STYLES.LIST_ITEM_SELECTED);
            }

            items.push({
                service: 'mixcloud',
                type: 'mixcloudUserShowsOption',
                title,
                icon: isSelected ? 'fa fa-check' : 'fa',
                uri: self._constructSelectOptionUri(view.select, opt.value)
            });
        });
        let title = mixcloud.getI18n(`MIXCLOUD_SELECT_${view.select.toUpperCase()}`);
        title = UIHelper.addIconBefore(USER_SHOWS_OPTION_ICONS[view.select], title);
        let lists = [{
            title,
            availableListViews: ['list'],
            items
        }];
        let nav = {
            prev: {
                uri: prevUri
            },
            lists
        };

        return libQ.resolve({
            navigation: nav
        });
    }

    _constructSelectOptionUri(option, value) {
        let prevViews = this.getPreviousViews();
        let curView = Object.assign({}, this.getCurrentView());

        if (curView[option] !== value) {
            delete curView.pageRef;
            delete curView.prevPageRefs;
            curView[option] = value;
        }
        delete curView.select;

        return this.constructUriFromViews(prevViews.concat(curView));
    }

    _browsePlaylistItems() {
        let self = this;
        let defer = libQ.defer();
        
        let view = self.getCurrentView();
        let prevUri = self.constructPrevUri();
        let playlistModel = self.getModel('playlist');
        let cloudcastModel = self.getModel('cloudcast');

        let options = {
            playlistId: decodeURIComponent(view.playlistId),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        playlistModel.getPlaylist(decodeURIComponent(options.playlistId)).then( playlist => {
            return cloudcastModel.getCloudcasts(options).then( cloudcasts => {
                let lists = [self._getCloudcastsList(cloudcasts)];
    
                let link = {
                    url: playlist.url,
                    text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_PLAYLIST'),
                    icon: { type: 'mixcloud' },
                    style: UIHelper.STYLES.VIEW_LINK,
                    target: '_blank'
                };
                let title = UIHelper.constructListTitleWithLink('', link, true);
                if (playlist.description) {
                    title += UIHelper.wrapInDiv(playlist.description, UIHelper.STYLES.DESCRIPTION);
                }
                if (playlist.description) {
                    title = UIHelper.wrapInDiv(title, 'width: 100%;');
                }
                else {
                    title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
                }
                lists[0].title = title;
                
                let nav = {
                    prev: {
                        uri: prevUri
                    },
                    lists
                };
   
                let playlistParser = self.getParser('playlist');
                nav.info = playlistParser.parseToHeader(playlist);
    
                defer.resolve({
                    navigation: nav
                });
            });
        
        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getCloudcastsList(cloudcasts, showMoreFromUser = false) {
        let self = this;
        let parser = self.getParser('cloudcast');
        let items = [];
        cloudcasts.items.forEach( cloudcast => {
            items.push(parser.parseToListItem(cloudcast, 'folder', showMoreFromUser));
        });
        let nextPageRef = self.constructPageRef(cloudcasts.nextPageToken, cloudcasts.nextPageOffset);
        if (nextPageRef) {
            let nextUri = self.constructNextUri(nextPageRef);
            items.push(self.constructNextPageItem(nextUri));
        }
        return {
            availableListViews: ['list', 'grid'],
            items
        };
    }

    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!view.cloudcastId && !view.username && !view.playlistId) {
            return libQ.reject("Operation not supported");
        }

        if (view.cloudcastId) {
            let model = self.getModel('cloudcast');
            return model.getCloudcast(decodeURIComponent(view.cloudcastId));
        }
        else if (view.username) {
            let self = this;
            let view = self.getCurrentView();
            let model = self.getModel('cloudcast');

            let options = {
                username: decodeURIComponent(view.username),
                limit: mixcloud.getConfigValue('itemsPerPage', 47)
            };

            if (view.pageRef) {
                let ref = self.parsePageRef(view.pageRef);
                options.pageToken = ref.pageToken;
                options.pageOffset = ref.pageOffset;
            }

            if (view.orderBy !== undefined) {
                options.orderBy = view.orderBy;
            }

            return model.getCloudcasts(options)
                .then( cloudcasts => cloudcasts.items );
        }
        else if (view.playlistId) {
            let self = this;
            
            let view = self.getCurrentView();
            let cloudcastModel = self.getModel('cloudcast');

            let options = {
                playlistId: decodeURIComponent(view.playlistId),
                limit: mixcloud.getConfigValue('itemsPerPage', 47)
            };

            if (view.pageRef) {
                let ref = self.parsePageRef(view.pageRef);
                options.pageToken = ref.pageToken;
                options.pageOffset = ref.pageOffset;
            }

            return cloudcastModel.getCloudcasts(options)
                .then( cloudcasts => cloudcasts.items );
        }
    }

    _browseSearchResults() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('cloudcast');
        let options = {
            keywords: decodeURIComponent(view.keywords),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        if (view.dateUploaded !== undefined) {
            options.dateUploaded = view.dateUploaded;
        }
        
        model.getCloudcasts(options).then( cloudcasts => {
            let searchOptions = model.getSearchOptions();
            let resultParams = ObjectHelper.assignProps(cloudcasts.params, 
                {}, ['dateUploaded']);
            let lists = [];               
            lists.push(self._getSearchParamsList(resultParams, searchOptions));
            lists.push(self._getCloudcastsList(cloudcasts, true));

            return lists;

        }).then( lists => {
            let nav = {
                prev: {
                    uri: prevUri
                },
                lists
            };

            defer.resolve({
                navigation: nav
            });

        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getSearchParamsList(params, searchOptions) {
        let self = this;
        let view = this.getCurrentView();
        let baseUri = self.constructUriWithParams(params);
        let items = [];

        let _constructSearchOptionItem = (o, title) => {
            return {
                service: 'mixcloud',
                type: 'mixcloudSearchOption',
                title,
                icon: SEARCH_OPTION_ICONS[o],
                uri: baseUri + '@select=' + o
            }
        }

        ['dateUploaded'].forEach( o => {
            let paramValue = params[o];
            if (paramValue !== undefined) {
                let optArr = searchOptions[o] || [];
                if (optArr.length) {
                    let opt = optArr.find( o => o.value == paramValue );
                    let title = opt ? opt.name : optArr[0].name;
                    if (o === 'dateUploaded') {
                        title = mixcloud.getI18n(`MIXCLOUD_${title.toUpperCase()}`);
                    }
                    title = UIHelper.addTextBefore(title, mixcloud.getI18n(`MIXCLOUD_SELECT_${o.toUpperCase()}`) + ': ', UIHelper.STYLES.PARAMS_LIST_ITEM_NAME);
                    items.push(_constructSearchOptionItem(o, title));
                }
            }
        });

        let title;
        if (view.inSection) {
            title = mixcloud.getI18n('MIXCLOUD_SHOWS');
        }
        else {
            title = mixcloud.getI18n('MIXCLOUD_SHOWS_MATCHING', decodeURIComponent(view.keywords));
        }

        return {
            title: UIHelper.addMixcloudIconToListTitle(title),
            availableListViews: ['list'],
            items
        };
    }

    _browseSearchOptions() {
        let self = this;

        let prevUri = self.constructPrevUri();
        let view = self.getCurrentView();
        let model = self.getModel('cloudcast');

        let searchOptions = model.getSearchOptions();

        let optArr = searchOptions[view.select] || [];
        let items = [];
        optArr.forEach( opt => {
            let isSelected = opt.value == view[view.select];
            let title = opt.name;
            if (view.select === 'dateUploaded') {
                title = mixcloud.getI18n(`MIXCLOUD_${title.toUpperCase()}`);
            }
            if (isSelected) {
                title = UIHelper.styleText(title, UIHelper.STYLES.LIST_ITEM_SELECTED);
            }

            items.push({
                service: 'mixcloud',
                type: 'mixcloudSearchOption',
                title,
                icon: isSelected ? 'fa fa-check' : 'fa',
                uri: self._constructSelectOptionUri(view.select, opt.value)
            });
        });
        let title = mixcloud.getI18n(`MIXCLOUD_SELECT_${view.select.toUpperCase()}`);
        title = UIHelper.addIconBefore(SEARCH_OPTION_ICONS[view.select], title);
        let lists = [{
            title,
            availableListViews: ['list'],
            items
        }];
        let nav = {
            prev: {
                uri: prevUri
            },
            lists
        };

        return libQ.resolve({
            navigation: nav
        });
    }

}

module.exports = CloudcastViewHandler;