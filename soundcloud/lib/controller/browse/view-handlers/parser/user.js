'use strict';

const sc = require(scPluginLibRoot + '/soundcloud');
const BaseParser = require(__dirname + '/base');

class UserParser extends BaseParser {

    parseToListItem(user) {
        let baseUri = this.getUri();
    
        let data = {
            'service': 'soundcloud',
            'type': 'folder',
            'title': user.username,
            'artist': user.fullname || user.location,
            'album': sc.getI18n('SOUNDCLOUD_USER_PARSER_ALBUM'),
            'albumart': user.thumbnail || this.getAvatarIcon(),
            'uri': baseUri + '/users@userId=' + user.id
        }
        return data;
    }

    parseToHeader(user) {
        let baseUri = this.getUri();

        return {
            'uri': baseUri,
            'service': 'soundcloud',
            'type': 'album',
            'title': user.username,
            'artist': user.fullname,
            'year': user.location,
            'albumart': user.thumbnail || this.getAvatarIcon()
        };
    }
}

module.exports = UserParser;