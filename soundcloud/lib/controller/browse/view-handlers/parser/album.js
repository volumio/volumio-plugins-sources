'use strict';

const PlaylistParser = require(__dirname + '/playlist');

class AlbumParser extends PlaylistParser {

    parseToListItem(album) {
        let baseUri = this.getUri();
        let data = super.parseToListItem(album);
        data.uri = baseUri + '/albums@albumId=' + album.id;

        return data;   
    }
}

module.exports = AlbumParser;