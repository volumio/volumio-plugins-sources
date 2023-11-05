import sc from '../../../../SoundCloudContext';
import AlbumEntity from '../../../../entities/AlbumEntity';
import { AlbumView } from '../AlbumViewHandler';
import ViewHelper from '../ViewHelper';
import SetRenderer from './SetRenderer';

export default class AlbumRenderer extends SetRenderer<AlbumEntity> {

  protected getListItemUri(data: AlbumEntity): string {
    const albumView: AlbumView = {
      name: 'albums',
      albumId: data.id?.toString()
    };
    return `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView)}`;
  }

  protected getListItemAlbum(): string {
    return sc.getI18n('SOUNDCLOUD_ALBUM_PARSER_ALBUM');
  }
}
