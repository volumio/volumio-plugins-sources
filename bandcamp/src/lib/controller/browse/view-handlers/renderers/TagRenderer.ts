import bandcamp from '../../../../BandcampContext';
import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import type TagEntity from '../../../../entities/TagEntity';
import ViewHelper from '../ViewHelper';
import { type DiscoverView } from '../DiscoverViewHandler';

export default class TagRenderer extends BaseRenderer<TagEntity> {

  renderToListItem(data: TagEntity): RenderedListItem | null {
    const discoverView: DiscoverView = {
      name: 'discover',
      customTags: data.value
    };
    return {
      service: 'bandcamp',
      type: 'item-no-menu',
      title: data.name,
      icon: 'fa',
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(discoverView)}`
    };
  }

  renderGenreListItem(data: TagEntity): RenderedListItem | null {
    const discoverView: DiscoverView = {
      name: 'discover',
      customTags: data.value
    };
    return {
      service: 'bandcamp',
      type: 'folder',
      title: data.name,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(discoverView)}`
    };
  }

  renderToHeader(data: TagEntity): RenderedHeader | null {
    return {
      uri: this.uri,
      service: 'bandcamp',
      type: 'song',
      title: data.name,
      artist: bandcamp.getI18n('BANDCAMP_HEADER_TAG')
    };
  }
}
