'use strict';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud')
const BaseViewHandler = require(__dirname + '/base');

class SelectionViewHandler extends BaseViewHandler {

    browse() {
        let self = this;
        let defer = libQ.defer();
        let view = self.getCurrentView();
     
        let selectionModel = self.getModel('selection');       
        selectionModel.getSelections({ mixed: true }).then( (selections) => {
            let selection = selections.items.find( s => s.id === view.selectionId );
            let items = [];
            if (selection && selection.items) {
                let parser = self.getParser('playlist');
                let offset = 0;
                if (view.pageRef) {
                    let ref = self.parsePageRef(view.pageRef);
                    offset = ref.pageToken;
                }
                let limit = sc.getConfigValue('itemsPerPage', 47);
                let nextOffset = offset + limit;
                let slice = selection.items.slice(offset, nextOffset);
                slice.forEach( (item) => {
                    items.push(parser.parseToListItem(item));
                });
                if (nextOffset < selection.items.length) {
                    let nextPageRef = self.constructPageRef(nextOffset, 0);
                    let nextUri = self.constructNextUri(nextPageRef);
                    items.push(self.constructNextPageItem(nextUri));
                }
            }
            let lists = [
                {
                    title: selection ? selection.title : '',
                    availableListViews: ['list', 'grid'],
                    items: items
                }
            ];
            defer.resolve({
                navigation: {
                    prev: {
                        uri: '/'
                    },
                    lists
                }
            });
        }).fail( (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }
}

module.exports = SelectionViewHandler;