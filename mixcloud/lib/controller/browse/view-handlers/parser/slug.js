'use strict';

const fs = require('fs')
const slugify = require('slugify');
const UIHelper = require(mixcloudPluginLibRoot + '/helper/ui');
const BaseParser = require(__dirname + '/base');

class SlugItemParser extends BaseParser {

    parseToListItem(slugItem) {
        let baseUri = this.getUri();
        let data = {
            service: 'mixcloud',
            type: 'folder',
            title: slugItem.name,
            uri: baseUri + '/discover@slug=' + slugItem.slug
        };
        let albumart = this._getAlbumArt(slugItem);
        if (albumart) {
            data.albumart = albumart;
        }
        else {
            data.icon = 'fa fa-tag';
        }
        return data;
    }

    _getAlbumArt(slugItem) {
        let filename = slugify(slugItem.name).toLowerCase() + '.png';
        let path = `music_service/mixcloud/assets/images/slugs/${filename}`;
        let realPath = `${mixcloudPluginLibRoot}/../assets/images/slugs/${filename}`;
        let retPath = `/albumart?sourceicon=${encodeURIComponent(path)}`;

        let exists;
        try {
            exists = fs.existsSync(realPath);
        } catch(err) {
            exists = false;
        }

        if (!exists) {
            try {
                retPath = UIHelper.getRandomAlbumArtFromDir('tags');
            } catch(err) {
                retPath = null;
            }
        }

        return retPath;
    }

}

module.exports = SlugItemParser;