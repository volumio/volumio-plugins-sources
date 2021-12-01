'use strict';

const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const BaseParser = require(__dirname + '/base');

class UserParser extends BaseParser {

    parseToListItem(user) {
        let baseUri = this.getUri();
        let data = {
            service: 'mixcloud',
            type: 'folder',
            title: user.name,
            albumart: user.thumbnail,
            uri: baseUri + '/user@username=' + encodeURIComponent(user.username)
        }
        if (user.location) {
            data.artist = user.location;
        }
        return data;
    }

    parseToHeader(user) {
        let baseUri = this.getUri();
        let header = {
            uri: baseUri,
            service: 'mixcloud',
            type: 'song',
            title: user.name,
            artist: mixcloud.getI18n('MIXCLOUD_HEADER_USER'),
            albumart: user.thumbnail
        };
        if (user.location) {
            header.year = user.location;
        }
        return header;
    }
}

module.exports = UserParser;