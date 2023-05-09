import Genre from '../../../../entities/Genre';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import jellyfin from '../../../../JellyfinContext';
import { AlbumView } from '../AlbumViewHandler';
import ViewHelper from '../ViewHelper';

export default class GenreRenderer extends BaseRenderer<Genre> {

  renderToListItem(data: Genre): RenderedListItem | null {
    const albumView: AlbumView = {
      name: 'albums',
      parentId: this.currentView.parentId,
      genreId: data.id
    };
    return {
      'service': 'jellyfin',
      'type': 'folder',
      'title': data.name,
      'albumart': this.getAlbumArt(data),
      'uri': `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView)}`
    };
  }

  renderToHeader(data: Genre): RenderedHeader | null {
    const header = super.renderToHeader(data) || {} as RenderedHeader;
    header.artist = jellyfin.getI18n('JELLYFIN_GENRE');
    return header;
  }
}
