'use strict';

const libQ = require('kew');
const BaseViewHandler = require(__dirname + '/base');

const ITEM_TYPE_TO_PARSER_NAME = {
    Folder: 'folder',
    CollectionFolder: 'folder',
    MusicAlbum: 'album',
    MusicArtist: 'artist'
};

class FolderViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();

        let prevUri = self.constructPrevUri();
        let nextUri = self.constructNextUri();
        
        let view = self.getCurrentView();
        let model = self.getModel('folder');

        self._handleFilters().then( async (result) => {
            let lists = result.filterList;
            let options = result.modelOptions;
            let folder = await model.getFolder(view.parentId);
            let folderContents = await model.getFolderContents(options);
            let items = [];
            folderContents.items.forEach( (item) => {
                let parserName = ITEM_TYPE_TO_PARSER_NAME[item.Type];
                if (parserName) {
                    let parser = self.getParser(parserName);
                    items.push(parser.parseToListItem(item));
                }
            });
            if (folderContents.startIndex + folderContents.items.length < folderContents.total) {
                items.push(self.constructNextPageItem(nextUri));
            }
            lists.push({
                availableListViews: items.length > 0 ? ['list', 'grid'] : ['list'],
                items: items
            });
            lists[0].title = folder.Name;
            return {
                prev: {
                    uri: prevUri
                },
                lists
            };
        })
        .then( nav => self.setPageTitle(view, nav) )
        .then( nav => {
            defer.resolve({
                navigation: nav
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    // Returns: 1. Filter list  2. Model options
    _handleFilters() {
        let self = this;
        let view = self.getCurrentView();
        let showFilters = true;
        /*let showFilters = view.fixedView == undefined && view.search == undefined && 
            view.artistId == undefined && view.albumArtistId == undefined;*/
        let filterListPromise;

        if (showFilters) {
            let saveFiltersKey = 'folder';
            self.saveFilters(saveFiltersKey);
            filterListPromise = self.getFilterList(saveFiltersKey, 'sort', 'az');
        }
        else {
            filterListPromise = libQ.resolve(null);
        }

        return filterListPromise.then( result => {
            let lists, options;
            if (result) {
                lists = result.list;
                options = self.getModelOptions(Object.assign({}, view, result.selection));
            }
            else {
                lists = [];
                options = self.getModelOptions();
            }

            return {
                filterList: lists,
                modelOptions: options
            };
        });
    }

}

module.exports = FolderViewHandler;