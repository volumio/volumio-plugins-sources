import mixcloud from '../../../../MixcloudContext';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { UserEntity } from '../../../../entities/UserEntity';
import { UserView } from '../UserViewHandler';
import ViewHelper from '../ViewHelper';

export default class UserRenderer extends BaseRenderer<UserEntity> {

  renderToListItem(user: UserEntity): RenderedListItem | null {
    const userView: UserView = {
      name: 'user',
      username: user.username
    };
    const result: RenderedListItem = {
      service: 'mixcloud',
      type: 'folder',
      title: user.name || user.username,
      albumart: user.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(userView)}`
    };

    if (user.location) {
      result.artist = user.location;
    }

    return result;
  }

  renderToHeader(user: UserEntity): RenderedHeader | null {
    const view = {...this.currentView};
    if (view.name === 'user' && view.playTarget) {
      delete view.playTarget;
    }
    const uri = ViewHelper.constructUriFromViews([ ...this.previousViews, view ]);
    const result: RenderedHeader = {
      uri,
      service: 'mixcloud',
      type: 'song',
      title: user.name || user.username,
      artist: mixcloud.getI18n('MIXCLOUD_HEADER_USER'),
      albumart: user.thumbnail
    };

    if (user.location) {
      result.year = user.location;
    }

    return result;
  }
}
