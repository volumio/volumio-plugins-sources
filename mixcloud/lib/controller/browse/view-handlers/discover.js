'use strict';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const ObjectHelper = require(mixcloudPluginLibRoot + '/helper/object');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const ExplodableViewHandler = require(__dirname + '/explodable');

const DISCOVER_OPTION_ICONS = {
    slug: 'fa fa-music',
    orderBy: 'fa fa-sort',
    country: 'fa fa-map-marker',
};

class DiscoverViewHandler extends ExplodableViewHandler {

    browse() {
        let view = this.getCurrentView();
        if (view.select) {
            return this._browseDiscoverOptions();
        }
        else {
            return this._browseDiscoverResults();
        }
    }

    getListType() {
        return 'all';
    }

    getTitle(selectedTags, orderBy, country) {
        let tagNames = selectedTags.map( t => t.name ).join(' &amp; ');
        let countryName = country ? `(${country.name})` : '';
        let i18nKey = 'MIXCLOUD_DISCOVER_TITLE';
        if (orderBy) {
            i18nKey += `_${orderBy.name.toUpperCase()}`;
        }
        let title = mixcloud.getI18n(i18nKey, tagNames, countryName);

        let featuredUri = this.getUri() + `/featured@slug=${selectedTags[0].slug}`;
        let featuredLink = this.constructGoToViewLink(mixcloud.getI18n('MIXCLOUD_VIEW_FEATURED_SHOWS', tagNames), featuredUri);

        return UIHelper.constructListTitleWithLink(title, featuredLink, true);
    }

    _browseDiscoverResults() {
        let self = this;
        let defer = libQ.defer();
        
        let prevUri = self.constructPrevUri();       
        let view = self.getCurrentView();
        let model = self.getModel('discover');

        let options = {
            limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection', 11) : mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        options = Object.assign(options, self._getDiscoverParamsFromUri());
        
        model.getDiscoverResults(options).then( cloudcasts => {
            let filteredParams = ObjectHelper.assignProps(cloudcasts.params, 
                { list: options.list }, 
                ['orderBy', 'country']);
            return model.getDiscoverOptions(filteredParams).then( discoverOptions => {
                delete filteredParams.list;
                let lists = [];               
                lists.push(self._getParamsList(cloudcasts.selectedTags, filteredParams, discoverOptions));
                lists.push(self._getCloudcastsList(cloudcasts));

                return lists;
            });

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

    _getDiscoverParamsFromUri() {
        let view = this.getCurrentView();
        let params = ObjectHelper.assignProps(view, { list: this.getListType() }, [
            'slug', 'orderBy', 'country'
        ]);
        return params;
    }

    _getParamsList(selectedTags, params, discoverOptions) {
        let self = this;
        let baseUri = self.constructUriWithParams(params);
        let items = [];

        let _constructDiscoverOptionItem = (o, title) => {
            return {
                service: 'mixcloud',
                type: 'mixcloudDiscoverOption',
                title,
                icon: DISCOVER_OPTION_ICONS[o],
                uri: baseUri + '@select=' + o
            }
        }

        if (selectedTags.length > 0) {
            let tagNames = selectedTags.map( t => t.name ).join(', ');
            items.push(_constructDiscoverOptionItem('slug', tagNames));
        }
        else {
            items.push(_constructDiscoverOptionItem('slug', mixcloud.getI18n('MIXCLOUD_ALL_CATEGORIES')));
        }
        ['orderBy', 'country'].forEach( o => {
            let paramValue = params[o];
            if (paramValue !== undefined) {
                let optArr = discoverOptions[o] || [];
                if (optArr.length) {
                    let opt = optArr.find( o => o.value == paramValue );
                    let title = opt ? opt.name : optArr[0].name;
                    if (o === 'orderBy') {
                        title = mixcloud.getI18n(`MIXCLOUD_ORDER_BY_${title.toUpperCase()}`);
                    }
                    items.push(_constructDiscoverOptionItem(o, title));
                }
            }
        });

        let orderBy ;
        if (discoverOptions.orderBy) {
            orderBy = discoverOptions.orderBy.find( o => o.value == params.orderBy);
        }

        let country;
        if (params.country && discoverOptions.allCountries) {
            country = discoverOptions.allCountries.find( c => c.value == params.country);
        }

        return {
            title: UIHelper.addMixcloudIconToListTitle(self.getTitle(selectedTags, orderBy, country)),
            availableListViews: ['list'],
            items
        };
    }

    _getCloudcastsList(cloudcasts) {
        let self = this;
        let parser = self.getParser('cloudcast');
        let items = [];
        cloudcasts.items.forEach( cloudcast => {
            items.push(parser.parseToListItem(cloudcast, 'folder', true));
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

    _browseDiscoverOptions() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri();
        let view = self.getCurrentView();
        let model = self.getModel('discover');

        let params = Object.assign({ list: this.getListType() }, view);
        model.getDiscoverOptions(params).then( discoverOptions => {
            let optArr = discoverOptions[view.select] || [];
            let items = [];
            optArr.forEach( opt => {
                let isSelected = opt.value == view[view.select];
                let title = opt.name;
                if (view.select === 'slug' && opt.value == null) {
                    title = mixcloud.getI18n('MIXCLOUD_ALL_CATEGORIES');
                }
                else if (view.select === 'orderBy') {
                    title = mixcloud.getI18n(`MIXCLOUD_ORDER_BY_${title.toUpperCase()}`);
                }
                if (isSelected) {
                    title = UIHelper.styleText(title, UIHelper.STYLES.LIST_ITEM_SELECTED);
                }

                items.push({
                    service: 'mixcloud',
                    type: 'mixcloudDiscoverOption',
                    title,
                    icon: isSelected ? 'fa fa-check' : 'fa',
                    uri: self._constructDiscoverOptionUri(view.select, opt.value)
                });
            });
            let title = mixcloud.getI18n(`MIXCLOUD_SELECT_${view.select.toUpperCase()}`);
            title = UIHelper.addIconBefore(DISCOVER_OPTION_ICONS[view.select], title);
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
            defer.resolve({
                navigation: nav
            });

        }).fail( error => {
            defer.reject(error);
        });

        return defer.promise;
    }

    _constructDiscoverOptionUri(option, value) {
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
        let model = self.getModel('discover');

        let options = {
            limit: mixcloud.getConfigValue('itemsPerPage', 47)
        };

        if (view.pageRef) {
            let ref = self.parsePageRef(view.pageRef);
            options.pageToken = ref.pageToken;
            options.pageOffset = ref.pageOffset;
        }

        options = Object.assign(options, self._getDiscoverParamsFromUri());
        
        return model.getDiscoverResults(options)
            .then( cloudcasts => cloudcasts.items );
    }

}

module.exports = DiscoverViewHandler;