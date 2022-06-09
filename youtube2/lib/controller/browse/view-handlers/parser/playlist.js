'use strict';

const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BaseParser = require(__dirname + '/base');

class PlaylistParser extends BaseParser {

    parseToListItem(playlist) {
        let baseUri = this.getUri();
    
        let data = {
            'service': 'youtube2',
            'type': 'folder',
            'title': playlist.title,
            'artist': playlist.channel.title,
            'album': yt2.getI18n('YOUTUBE2_PLAYLIST_PARSER_ALBUM'),
            'albumart': playlist.thumbnail,
            'uri': baseUri + '/videos@playlistId=' + playlist.id
        }
        return data;
    }
}

module.exports = PlaylistParser;