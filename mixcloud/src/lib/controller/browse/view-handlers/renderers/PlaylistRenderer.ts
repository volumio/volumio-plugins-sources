import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { PlaylistEntity } from '../../../../entities/PlaylistEntity';
import mixcloud from '../../../../MixcloudContext';
import ViewHelper from '../ViewHelper';
import { CloudcastView } from '../CloudcastViewHandler';

export default class PlaylistRenderer extends BaseRenderer<PlaylistEntity> {

  renderToListItem(playlist: PlaylistEntity): RenderedListItem | null {
    const cloudcastView: CloudcastView = {
      name: 'cloudcasts',
      playlistId: playlist.id
    };
    return {
      service: 'mixcloud',
      type: 'folder',
      title: playlist.name,
      album: mixcloud.getI18n('MIXCLOUD_PLAYLIST'),
      artist: playlist.owner?.name,
      albumart: playlist.owner?.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(cloudcastView)}`
    };
  }

  renderToHeader(playlist: PlaylistEntity): RenderedHeader | null {
    return {
      uri: this.uri,
      service: 'mixcloud',
      type: 'song',
      title: playlist.name,
      artist: mixcloud.getI18n('MIXCLOUD_HEADER_PLAYLIST', playlist.owner?.name),
      albumart: playlist.owner?.thumbnail
    };
  }
}
