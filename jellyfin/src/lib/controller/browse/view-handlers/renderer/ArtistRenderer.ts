import Artist from '../../../../entities/Artist';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import jellyfin from '../../../../JellyfinContext';
import { EntityType } from '../../../../entities';
import { AlbumView } from '../AlbumViewHandler';
import ViewHelper from '../ViewHelper';

export default class ArtistRenderer extends BaseRenderer<Artist> {

  renderToListItem(data: Artist, options?: { noParent: boolean }): RenderedListItem | null {
    const albumView: AlbumView = {
      name: 'albums'
    };

    const parentId = options?.noParent ? null : this.currentView.parentId;
    if (parentId) {
      albumView.parentId = parentId;
    }

    if (data.type === EntityType.Artist) {
      albumView.artistId = data.id;
    }
    else {
      albumView.albumArtistId = data.id;
    }

    return {
      service: 'jellyfin',
      type: 'folder',
      title: data.name,
      albumart: this.getAlbumArt(data),
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView)}`
    };
  }

  renderToHeader(data: Artist): RenderedHeader | null {
    const header = super.renderToHeader(data) || {} as RenderedHeader;
    header.artist = jellyfin.getI18n('JELLYFIN_ARTIST');
    header.year = this.getStringFromIdNamePair(data.genres);
    return header;
  }
}
