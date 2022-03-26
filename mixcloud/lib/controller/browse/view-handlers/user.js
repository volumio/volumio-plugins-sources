'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const ExplodableViewHandler = require(__dirname + '/explodable');

const SEARCH_OPTION_ICONS = {
    dateJoined: 'fa fa-sign-in',
    userType: 'fa fa-user'
};

class UserViewHandler extends ExplodableViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (view.username) {
            return this._browseUser();
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

    _browseUser() {
        let self = this;

        let view = self.getCurrentView();
        let defer = libQ.defer();
        let prevUri = self.constructPrevUri();
        let userModel = self.getModel('user');

        userModel.getUser(decodeURIComponent(view.username)).then( user => {
            let fetches = [
                self._getShows(view.username),
                self._getPlaylists(view.username),
            ];
            return libQ.all(fetches).then( results => {
                let lists = [];
                results.forEach( result => {
                    lists = lists.concat(result);
                });

                let firstTitle = lists[0] ? (lists[0].title || '') : '';
                let link = {
                    url: user.url,
                    text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_USER', user.name),
                    icon: { type: 'mixcloud' },
                    style: UIHelper.STYLES.VIEW_LINK,
                    target: '_blank'
                };
                let title = UIHelper.constructListTitleWithLink('', link, true);
                if (user.about) {
                    title += UIHelper.wrapInDiv(user.about, UIHelper.STYLES.DESCRIPTION);
                    title += UIHelper.wrapInDiv(' ', 'padding-top: 36px;');
                }
                title += firstTitle;
                if (user.about) {
                    title = UIHelper.wrapInDiv(title, 'width: 100%;');
                }
                else {
                    title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
                }
                if (lists[0]) {
                    lists[0].title = title;
                }
                else {
                    lists = [{
                        title,
                        availableListViews: ['list', 'grid'],
                        items: []
                    }];
                }


                let nav = {
                    prev: {
                        uri: prevUri
                    },
                    lists
                };
                
                let userParser = self.getParser('user');
                nav.info = userParser.parseToHeader(user);
    
                defer.resolve( {
                    navigation: nav
                });
            });

        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _getShows(username) {
        let defer = libQ.defer();
        let uri = `${this.getUri()}/cloudcasts@username=${username}@inSection=1`;
        require(mixcloudPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(uri).browse()
            .then( result => {
                defer.resolve(result.navigation.lists);
            }).fail( error => {
                mixcloud.getLogger().error(error);
                defer.resolve([]);
            });

        return defer.promise;
    }

    _getPlaylists(username) {
        let defer = libQ.defer();
        let uri = `${this.getUri()}/playlists@username=${username}@inSection=1`;
        require(mixcloudPluginLibRoot + '/controller/browse/view-handlers/factory').getHandler(uri).browse()
            .then( result => {
                defer.resolve(result.navigation.lists);
            }).fail( error => {
                mixcloud.getLogger().error(error);
                defer.resolve([]);
            });

        return defer.promise;
    }

    _getUsersList(users) {
        let self = this;
        let parser = self.getParser('user');
        let items = [];
        users.items.forEach( user => {
            items.push(parser.parseToListItem(user));
        });
        let nextPageRef = self.constructPageRef(users.nextPageToken, users.nextPageOffset);
        if (nextPageRef) {
            let nextUri = self.constructNextUri(nextPageRef);
            items.push(self.constructNextPageItem(nextUri));
        }
        return {
            availableListViews: ['list', 'grid'],
            items
        };
    }

    _browseSearchResults() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('user');
        let options = {
            keywords: decodeURIComponent(view.keywords),
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        options = ObjectHelper.assignProps(view, options, [
            'dateJoined', 'userType']);

        model.getUsers(options).then( users => {
            let searchOptions = model.getSearchOptions();
            let resultParams = ObjectHelper.assignProps(users.params, 
                {}, ['dateJoined', 'userType']);
            let lists = [];               
            lists.push(self._getSearchParamsList(resultParams, searchOptions));
            lists.push(self._getUsersList(users, true));

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

        ['dateJoined', 'userType'].forEach( o => {
            let paramValue = params[o];
            if (paramValue !== undefined) {
                let optArr = searchOptions[o] || [];
                if (optArr.length) {
                    let opt = optArr.find( o => o.value == paramValue );
                    let title = opt ? opt.name : optArr[0].name;
                    title = mixcloud.getI18n(`MIXCLOUD_${title.toUpperCase()}`);
                    title = UIHelper.addTextBefore(title, mixcloud.getI18n(`MIXCLOUD_SELECT_${o.toUpperCase()}`) + ': ', UIHelper.STYLES.PARAMS_LIST_ITEM_NAME);
                    items.push(_constructSearchOptionItem(o, title));
                }
            }
        });

        let title;
        if (view.inSection) {
            title = mixcloud.getI18n('MIXCLOUD_USERS');
        }
        else {
            title = mixcloud.getI18n('MIXCLOUD_USERS_MATCHING', decodeURIComponent(view.keywords));
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
        let model = self.getModel('user');

        let searchOptions = model.getSearchOptions();

        let optArr = searchOptions[view.select] || [];
        let items = [];
        optArr.forEach( opt => {
            let isSelected = opt.value == view[view.select];
            let title = opt.name;
            title = mixcloud.getI18n(`MIXCLOUD_${title.toUpperCase()}`);
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

    getTracksOnExplode() {
        let self = this;

        let view = self.getCurrentView();
        if (!view.username) {
            return libQ.reject("Operation not supported");
        }

        let model = self.getModel('cloudcast');

        let options = {
            username: decodeURIComponent(view.username),
            limit: mixcloud.getConfigValue('itemsPerPage', 47)
        };

        return model.getCloudcasts(options)
            .then( cloudcasts => cloudcasts.items );
    }

}

module.exports = UserViewHandler;