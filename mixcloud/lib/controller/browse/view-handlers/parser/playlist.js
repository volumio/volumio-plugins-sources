'use strict';

const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const BaseParser = require(__dirname + '/base');

class PlaylistParser extends BaseParser {

    parseToListItem(playlist) {
        let baseUri = this.getUri();
        let data = {
            service: 'mixcloud',
            type: 'folder',
            title: playlist.name,
            album: mixcloud.getI18n('MIXCLOUD_PLAYLIST'),
            artist: playlist.owner.name,
            albumart: playlist.owner.thumbnail,
            uri: baseUri + '/cloudcasts@playlistId=' + encodeURIComponent(playlist.id)
        }
        return data;
    }

    parseToHeader(playlist) {
        let baseUri = this.getUri();
        let header = {
            uri: baseUri,
            service: 'mixcloud',
            type: 'song',
            title: playlist.name,
            artist: mixcloud.getI18n('MIXCLOUD_HEADER_PLAYLIST', playlist.owner.name),
            albumart: playlist.owner.thumbnail
        };
        return header;
    }
}

module.exports = PlaylistParser;