'use strict';

const BaseModel = require(__dirname + '/base');

class FolderModel extends BaseModel {

    getFolderContents(options = {}, tag = '') {
        let queryOptions = this.getBaseQueryOptions({...options, recursive: false}, 'CollectionFolder,Folder,MusicAlbum,MusicArtist');

        return this.getItems(queryOptions, tag);
    }

    getFolder(folderId) {
        return this.getItem(folderId);
    }

}

module.exports = FolderModel;
