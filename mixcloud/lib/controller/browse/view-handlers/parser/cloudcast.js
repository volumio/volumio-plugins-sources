'use strict';

const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const BaseParser = require(__dirname + '/base');

class CloudcastParser extends BaseParser {

    parseToListItem(cloudcast, asType = 'folder', showMoreFromUser = false) {
        let baseUri = this.getUri();
        let data = {
            service: 'mixcloud',
        }
        if (asType === 'folder') {
            data.type = 'folder';
            data.title = cloudcast.name;
            data.album = mixcloud.getI18n('MIXCLOUD_SHOW');
            data.artist = cloudcast.owner.name;
            data.duration = cloudcast.duration;
            data.albumart = cloudcast.thumbnail;
            data.uri = baseUri + '/cloudcast@cloudcastId=' + encodeURIComponent(cloudcast.id);
            if (cloudcast.isExclusive) {
                data.title = UIHelper.addExclusiveText(data.title);
            }
            if (showMoreFromUser) {
                data.uri += '@showMoreFromUser=1';
            }
        }
        else if (asType === 'playShowItem') {
            if (cloudcast.isExclusive) {
                data.type = 'mixcloudDummyItem';
                data.title = UIHelper.styleText(mixcloud.getI18n('MIXCLOUD_EXCLUSIVE_DESC'), UIHelper.STYLES.EXCLUSIVE_DESC);
                data.uri = baseUri + '@noExplode=1';
                data.icon = 'fa fa-ban';
            }
            else {
                data.type = 'song';
                data.title = mixcloud.getI18n('MIXCLOUD_PLAY_SHOW');
                data.duration = cloudcast.duration;
                data.albumart = cloudcast.thumbnail;
                data.uri = baseUri;
            }
        }
        
        return data;
    }

    parseToHeader(cloudcast) {
        let baseUri = this.getUri();
        let header = {
            uri: baseUri,
            service: 'mixcloud',
            type: 'song',
            title: cloudcast.name,
            artist: mixcloud.getI18n('MIXCLOUD_HEADER_SHOW', cloudcast.owner.name),
            albumart: cloudcast.thumbnail
        };

        return header;
    }
}

module.exports = CloudcastParser;