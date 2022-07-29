'use strict';

const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BaseParser = require(__dirname + '/base');

class ChannelParser extends BaseParser {

    parseToListItem(channel) {
        let baseUri = this.getUri();
    
        let data = {
            'service': 'youtube2',
            'type': 'folder',
            'title': channel.title,
            'album': yt2.getI18n('YOUTUBE2_CHANNEL_PARSER_ALBUM'),
            'albumart': channel.thumbnail,
            'uri': baseUri + '/playlists@channelId=' + channel.id
        }
        return data;
    }

    parseToHeader(item) {
        let baseUri = this.getUri();

        return {
            'uri': baseUri,
            'service': 'youtube2',
            'type': 'song',
            'title': item.title,
            'artist': item.description,
            'albumart': item.thumbnail
        };
    }
}

module.exports = ChannelParser;