import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import Song from '../../../../entities/Song';
import { SongView } from '../SongViewHandler';
import ViewHelper from '../ViewHelper';

export default class SongRenderer extends BaseRenderer<Song> {

  renderToListItem(data: Song): RenderedListItem | null {
    const songView: SongView = {
      name: 'song',
      songId: data.id
    };

    return {
      service: 'jellyfin',
      type: 'song',
      title: data.name,
      artist: this.getStringFromIdNamePair(data.artists),
      album: data.album?.name,
      duration: data.duration,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(songView)}`,
      albumart: this.getAlbumArt(data),
      favorite: data.favorite
    };
  }

  renderToHeader(): RenderedHeader | null {
    return null;
  }
}
