import { ContentItem, PageElement } from '../../../../types';
import { GenericView } from '../GenericViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default class ChannelRenderer extends BaseRenderer<ContentItem.Channel, PageElement.Header> {

  renderToListItem(data: ContentItem.Channel): RenderedListItem | null {
    if (!data.endpoint) {
      return null;
    }
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    return {
      service: 'ytmusic',
      type: 'folder',
      title: data.name,
      artist: data.subtitle,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  renderToHeader(data: PageElement.Header): RenderedHeader | null {
    const endpoint = data.endpoint || this.currentView.endpoint;
    if (!endpoint) {
      return null;
    }
    const targetView: GenericView = {
      name: 'generic',
      endpoint
    };
    const result: RenderedHeader = {
      uri: `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      service: 'ytmusic',
      type: 'album',
      title: data.title,
      duration: data.subtitles?.join(' • '),
      albumart: data.thumbnail
    };

    if (data.description) {
      result.artist = data.description;
    }

    return result;
  }
}
