'use strict';

const libQ = require('kew');
const FeedViewHandler = require(__dirname + '/feed');

class AlbumViewHandler extends FeedViewHandler {

  #albumArtist;

  browse() {
    const defer = libQ.defer();

    super.browse().then((result) => {
      if (this.#albumArtist?.id) {
        const prevViews = this.getPreviousViews();
        const lastView = prevViews[prevViews.length - 1];
        const isComingFromSameArtistView = (lastView?.name === 'artist' && lastView?.artistId === this.#albumArtist?.id);
        if (!isComingFromSameArtistView) {
          result.navigation.lists.unshift({
            availableListViews: ['list'],
            items: [this.getParser('album').parseToMoreFromArtistItem(this.#albumArtist)]
          });
        }
      }
      defer.resolve(result);
    })
      .fail((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  async getContents() {
    const view = this.getCurrentView();
    const model = this.getModel('album');
    const album = await model.getAlbum(decodeURIComponent(view.albumId));
    this.#albumArtist = album?.header?.artist;
    return album;
  }

  getTracksOnExplode() {
    const view = this.getCurrentView();
    if (!view.albumId) {
      return libQ.reject("Operation not supported");
    }

    const defer = libQ.defer();
    const model = this.getModel('album');
    const songParser = this.getParser('song');
    const videoParser = this.getParser('video');
    model.getAlbum(decodeURIComponent(view.albumId)).then((album) => {
      const items = album.sections?.[0]?.contents?.filter((content) => content.type === 'song' || content.type === 'video')
        .map((item) => {
          const parser = item.type === 'song' ? songParser : videoParser;
          return parser.getExplodeTrackData(this._fillItemInfo(item, album));
        });
      defer.resolve(items || []);
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  // Overrides FeedViewHandler.parseItemDataToListItem()
  parseItemDataToListItem(data, sectionIndex, contents) {
    if (sectionIndex === 0) {
      if (data.type === 'song' || data.type === 'video') {
        // Item data lacks album / artist / thumbnail info. Complete it by taking missing info from `contents`.
        // ('contents' is the album fetched in getContents())
        return this.getParser(data.type).parseToListItem(this._fillItemInfo(data, contents), { noAlbumart: true });
      }
      return null;
    }
    return super.parseItemDataToListItem(data, sectionIndex, contents);
  }

  _fillItemInfo(item, album) {
    return {
      ...item,
      albumText: album.header?.title,
      artistText: album.header?.artistText,
      thumbnail: album.header?.thumbnail
    };
  }
}

module.exports = AlbumViewHandler;
