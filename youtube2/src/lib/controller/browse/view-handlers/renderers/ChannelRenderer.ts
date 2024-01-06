import { ContentItem, PageElement } from '../../../../types';
import { GenericView } from '../GenericViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default class ChannelRenderer extends BaseRenderer<ContentItem.Channel, PageElement.Header> {

  renderToListItem(data: ContentItem.Channel): RenderedListItem | null {
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    return {
      service: 'youtube2',
      type: 'folder',
      title: data.name,
      artist: data.subscribers,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  renderToHeader(data: PageElement.Header): RenderedHeader | null {
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    const result: RenderedHeader = {
      uri: `youtube2/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      service: 'youtube2',
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
