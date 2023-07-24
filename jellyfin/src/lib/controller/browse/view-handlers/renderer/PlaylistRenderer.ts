import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import Playlist from '../../../../entities/Playlist';
import jellyfin from '../../../../JellyfinContext';
import { SongView } from '../SongViewHandler';
import ViewHelper from '../ViewHelper';

export default class PlaylistRenderer extends BaseRenderer<Playlist> {

  renderToListItem(data: Playlist): RenderedListItem | null {
    const songView: SongView = {
      name: 'songs',
      playlistId: data.id
    };

    return {
      service: 'jellyfin',
      type: 'folder',
      title: data.name,
      albumart: this.getAlbumArt(data),
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(songView)}`
    };
  }

  renderToHeader(data: Playlist): RenderedHeader | null {
    const header = super.renderToHeader(data) || {} as RenderedHeader;
    header.artist = jellyfin.getI18n('JELLYFIN_PLAYLIST');
    return header;
  }
}
