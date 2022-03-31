'use strict';

const sc = require(scPluginLibRoot + '/soundcloud');
const BaseParser = require(__dirname + '/base');

class TrackParser extends BaseParser {

    parseToListItem(track) {
        let baseUri = this.getUri();

        let artistLabel;
        let albumLabel = track.album || sc.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
        switch(track.playableState) {
            case 'blocked':
                artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
                albumLabel = '';
                break;
            case 'snipped':
                artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_SNIPPED') + ' ' + track.user.username;
                break;
            default:
                artistLabel = track.user.username;
        }

        let data = {
            'service': 'soundcloud',
            'type': 'song',
            'title': track.title,
            'artist': artistLabel,
            'album': albumLabel,
            'albumart': track.thumbnail || this.getSoundCloudIcon(),
            'uri': baseUri + '/track@trackId=' + track.id
        }
        return data;
    }
}

module.exports = TrackParser;