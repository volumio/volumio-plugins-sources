import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { CloudcastEntity } from '../../../../entities/CloudcastEntity';
import mixcloud from '../../../../MixcloudContext';
import UIHelper, { UI_STYLES } from '../../../../util/UIHelper';
import { CloudcastView } from '../CloudcastViewHandler';
import ViewHelper from '../ViewHelper';

export default class CloudcastRenderer extends BaseRenderer<CloudcastEntity> {

  renderToListItem(
    cloudcast: CloudcastEntity,
    asType: 'folder' | 'playShowItem' = 'folder',
    showMoreFromUser = false): RenderedListItem | null {

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
        title = cloudcast.name;
        album = mixcloud.getI18n('MIXCLOUD_SHOW');
        artist = cloudcast.owner?.name || cloudcast.owner?.username;
        duration = cloudcast.duration;
        albumart = cloudcast.thumbnail;

        const cloudcastView: CloudcastView = {
          name: 'cloudcast',
          cloudcastId: cloudcast.id
        };
        uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(cloudcastView)}`;

        if (cloudcast.isExclusive) {
          title = UIHelper.addExclusiveText(title);
        }
        if (showMoreFromUser) {
          uri += '@showMoreFromUser=1';
        }
        break;

      case 'playShowItem':
        if (cloudcast.isExclusive) {
          type = 'item-no-menu';
          title = UIHelper.styleText(mixcloud.getI18n('MIXCLOUD_EXCLUSIVE_DESC'), UI_STYLES.EXCLUSIVE_DESC);
          uri = `${this.uri}@noExplode=1`;
          icon = 'fa fa-ban';
        }
        else {
          type = 'song';
          title = mixcloud.getI18n('MIXCLOUD_PLAY_SHOW');
          duration = cloudcast.duration;
          albumart = cloudcast.thumbnail;
          uri = this.uri;
        }
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

  renderToHeader(cloudcast: CloudcastEntity): RenderedHeader | null {
    return {
      uri: this.uri,
      service: 'mixcloud',
      type: 'song',
      title: cloudcast.name,
      artist: mixcloud.getI18n('MIXCLOUD_HEADER_SHOW', cloudcast.owner?.name || cloudcast.owner?.username),
      albumart: cloudcast.thumbnail
    };
  }
}
