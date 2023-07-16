import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import UIHelper from '../../../../util/UIHelper';
import AlbumEntity from '../../../../entities/AlbumEntity';
import { AlbumView } from '../AlbumViewHandler';
import ViewHelper from '../ViewHelper';

export default class AlbumRenderer extends BaseRenderer<AlbumEntity> {

  renderToListItem(data: AlbumEntity): RenderedListItem | null {
    if (!data.url) {
      return null;
    }
    const albumView: AlbumView = {
      name: 'album',
      albumUrl: data.url
    };
    return {
      service: 'bandcamp',
      type: 'folder',
      title: this.addType('album', data.name),
      artist: data.artist?.name,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView)}`
    };
  }

  renderToHeader(data: AlbumEntity): RenderedHeader | null {
    return {
      uri: this.uri,
      service: 'bandcamp',
      type: 'song',
      album: data.name,
      artist: data.artist?.name,
      albumart: data.thumbnail,
      year: data.releaseDate ? UIHelper.reformatDate(data.releaseDate) : null
    };
  }
}
