import sc from '../../../../SoundCloudContext';
import SetEntity from '../../../../entities/SetEntity';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default abstract class SetRenderer<T extends SetEntity> extends BaseRenderer<T> {

  renderToListItem(data: T): RenderedListItem | null {
    if (data.id === undefined || data.id === null || data.id === '' || !data.title) {
      return null;
    }
    const result: RenderedListItem = {
      service: 'soundcloud',
      type: 'folder',
      title: data.title,
      artist: data.user?.username,
      album: sc.getI18n('SOUNDCLOUD_PLAYLIST_PARSER_ALBUM'),
      albumart: data.thumbnail || this.getSoundCloudIcon(),
      uri: this.getListItemUri(data)
    };

    return result;
  }

  renderToHeader(data: T): RenderedHeader | null {
    return {
      'uri': this.uri,
      'service': 'soundcloud',
      'type': 'album',
      'title': data.title,
      'artist': data.user?.username,
      'year': data.user?.fullName !== data.user?.username ? data.user?.fullName : null,
      'duration': data.user?.location,
      'albumart': data.thumbnail || this.getSoundCloudIcon()
    };
  }

  protected abstract getListItemUri(data: T): string;
  protected abstract getListItemAlbum(data: T): string;
}
