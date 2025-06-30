import BaseRenderer, { RenderedListItem } from './BaseRenderer';
import { LiveStreamEntity } from '../../../../entities/LiveStreamEntity';
import mixcloud from '../../../../MixcloudContext';
import ViewHelper from '../ViewHelper';
import { UserView } from '../UserViewHandler';
import { LiveStreamView } from '../LiveStreamViewHandler';

export default class LiveStreamRenderer extends BaseRenderer<LiveStreamEntity> {

  renderToListItem(
    liveStream: LiveStreamEntity,
    asType: 'folder' | 'playLiveStreamItem' = 'folder'): RenderedListItem | null {

    if (!liveStream.isLive || !liveStream.owner) {
      return null;
    }

    let type: RenderedListItem['type'];
    let title: string;
    let album: string | undefined;
    let artist: string | undefined;
    let duration: number | undefined;
    let albumart: string | undefined;
    let icon: string | undefined;
    let uri: string;

    switch (asType) {
      case 'folder':
        type = 'folder';
        title = liveStream.name;
        album = mixcloud.getI18n('MIXCLOUD_LIVE_STREAM');
        artist = liveStream.owner?.name || liveStream.owner?.username;
        albumart = liveStream.thumbnail;

        const userView: UserView = {
          name: 'user',
          username: liveStream.owner.username,
          playTarget: 'liveStream'
        };
        uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(userView)}`;
        break;

      case 'playLiveStreamItem':
        const liveStreamView: LiveStreamView = {
          name: 'liveStream',
          username: liveStream.owner.username
        };
        const playUri = ViewHelper.constructUriFromViews([ ...this.previousViews, liveStreamView ]);
        type = 'song';
        title = liveStream.name;
        artist = liveStream.owner?.name || liveStream.owner?.username;
        albumart = liveStream.thumbnail;
        uri = playUri;
        break;
    }

    return {
      service: 'mixcloud',
      type,
      title,
      album,
      artist,
      duration,
      albumart,
      icon,
      uri
    };
  }
}
