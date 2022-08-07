'use strict';

class BaseParser {

    constructor(uri, curView, prevViews) {
        this._uri = uri;
        this._curView = curView;
        this._prevViews = prevViews;
    }

    parseToListItem(item) {
        return null;
    }

    parseToHeader(item) {
        let baseUri = this.getUri();

        return {
            'uri': baseUri,
            'service': 'youtube2',
            'type': 'song',
            'title': item.title,
            'artist': item.channel.title,
            'albumart': item.thumbnail
        };
    }

    getUri() {
        return this._uri;
    }

    getCurrentView() {
        return this._curView;
    }

    getPreviousViews() {
        return this._prevViews;
    }

}

module.exports = BaseParser;