'use strict';

const sc = require(scPluginLibRoot + '/soundcloud');
const PlaylistViewHandler = require(__dirname + '/playlist');

class AlbumViewHandler extends PlaylistViewHandler {

    _getEntityName() {
        return 'album';
    }

    _getModelFetchFunctionName(browseSingle) {
        if (browseSingle) {
            return 'getAlbum';
        }
        else {
            return 'getAlbums';
        }
    }

    _getBrowseMultipleListTitle() {
        return sc.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS');
    }

    _getBrowseSingleTargetId(view) {
        return view.albumId;
    }

    _getVisitLinkText() {
        return sc.getI18n('SOUNDCLOUD_VISIT_LINK_ALBUM');
    }
}

module.exports = AlbumViewHandler;