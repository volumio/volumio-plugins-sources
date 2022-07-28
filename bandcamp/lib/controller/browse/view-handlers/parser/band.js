'use strict';

const bandcamp = require(bandcampPluginLibRoot + '/bandcamp');
const BaseParser = require(__dirname + '/base');

class BandParser extends BaseParser {

    parseToListItem(band) {
        let baseUri = this.getUri();
        let data = {
            'service': 'bandcamp',
            'type': 'folder',
            'title': band.name,
            'albumart': band.thumbnail,
            'uri': baseUri + '/band@bandUrl=' + encodeURIComponent(band.url)
        }
        if (band.location) {
            data.artist = band.location;
        }
        return data;
    }

    parseToHeader(band) {
        let baseUri = this.getUri();
        let header = {
            'uri': baseUri,
            'service': 'bandcamp',
            'type': 'song',
            'title': band.name,
            'albumart': band.thumbnail
        };
        switch(band.type) {
            case 'artist':
                header.artist = bandcamp.getI18n('BANDCAMP_HEADER_ARTIST');
                break;
            case 'label':
                header.artist = bandcamp.getI18n('BANDCAMP_HEADER_LABEL');
                break;
            default:
        }
        if (band.location) {
            header.year = band.location;
        }
        if (band.label) {
            header.duration = band.label.name;
        }
        return header;
    }
}

module.exports = BandParser;