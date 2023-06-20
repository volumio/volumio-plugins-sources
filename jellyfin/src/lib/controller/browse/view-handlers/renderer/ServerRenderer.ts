import Server from '../../../../entities/Server';
import { UserViewView } from '../UserViewViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default class ServerRenderer extends BaseRenderer<Server & { username: string }> {

  renderToListItem(data: Server & { username: string }): RenderedListItem | null {
    const userViewView: UserViewView = {
      name: 'userViews',
      username: data.username,
      serverId: data.id
    };

    return {
      'service': 'jellyfin',
      'type': 'streaming-category',
      'title': `${data.username} @ ${data.name}`,
      'uri': `jellyfin/${ViewHelper.constructUriSegmentFromView(userViewView)}`,
      'albumart': '/albumart?sourceicon=music_service/jellyfin/dist/assets/images/jellyfin.png'
    };
  }

  renderToHeader(): RenderedHeader | null {
    return null;
  }
}
