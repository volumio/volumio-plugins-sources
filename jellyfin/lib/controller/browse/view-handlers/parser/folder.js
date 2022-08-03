'use strict';

const BaseParser = require(__dirname + '/base');

class FolderParser extends BaseParser {

    parseToListItem(folder) {
        let baseUri = this.getUri();
        let data = {
            'service': 'jellyfin',
            'type': 'streaming-category',
            'uri': baseUri + '/folder@parentId=' + folder.Id,
            'albumart': this.getAlbumArt(folder)
        }
        if (folder.Type === 'Folder') {
            data.title = `
                <div style='display: inline-flex; align-items: center;'>
                    <i class='fa fa-folder-o' style='font-size: 20px; margin: -3px 8px 0 1px;'></i> <span>${folder.Name}</span>
                </div>
            `;
        }
        else {
            data.title = folder.Name;
        }

        return data;
    }
}

module.exports = FolderParser;
