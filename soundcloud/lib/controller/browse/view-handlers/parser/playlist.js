'use strict';

const sc = require(scPluginLibRoot + '/soundcloud');
const BaseParser = require(__dirname + '/base');

class PlaylistParser extends BaseParser {

    parseToListItem(playlist) {
        let baseUri = this.getUri();
    
        let data = {
            'service': 'soundcloud',
            'type': 'folder',
            'title': playlist.title,
            'artist': playlist.user.username,
            'album': sc.getI18n('SOUNDCLOUD_PLAYLIST_PARSER_ALBUM'),
            'albumart': playlist.thumbnail || this.getSoundCloudIcon(),
            'uri': baseUri + '/playlists@playlistId=' + playlist.id
        }

        if (playlist.type === 'system-playlist') {
            data.uri += '@type=system';
        }

        return data;
    }

    parseToHeader(playlist) {
        let baseUri = this.getUri();

        return {
            'uri': baseUri,
            'service': 'soundcloud',
            'type': 'album',
            'title': playlist.title,
            'artist': playlist.user.username,
            'year': playlist.user.fullname !== playlist.user.username ? playlist.user.fullname : null,
            'duration': playlist.user.location,
            'albumart': playlist.thumbnail || this.getSoundCloudIcon()
        };
    }
}

module.exports = PlaylistParser;