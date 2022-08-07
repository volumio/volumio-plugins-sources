'use strict';

const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BaseParser = require(__dirname + '/base');

class VideoParser extends BaseParser {

    parseToListItem(video) {
        let baseUri = this.getUri();

        let data = {
            'service': 'youtube2',
            'type': 'song',
            'title': video.title,
            'artist': video.channel.title,
            'album': yt2.getI18n('YOUTUBE2_VIDEO_PARSER_ALBUM'),
            'albumart': video.thumbnail,
            'uri': baseUri + '/video@videoId=' + video.id,
            'duration': video.duration
        }
        return data;
    }
}

module.exports = VideoParser;