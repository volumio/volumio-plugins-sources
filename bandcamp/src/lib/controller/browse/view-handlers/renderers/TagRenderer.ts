import bandcamp from '../../../../BandcampContext';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import UIHelper, { UI_STYLES } from '../../../../util/UIHelper';
import TagEntity from '../../../../entities/TagEntity';
import { TagView } from '../TagViewHandler';
import ViewHelper from '../ViewHelper';

export interface TagListSelectionRenderParams {
  selected: boolean;
  uri: string;
}

export default class TagRenderer extends BaseRenderer<TagEntity> {

  renderToListItem(data: TagEntity, listSelectionParams: TagListSelectionRenderParams): RenderedListItem | null {
    const title = listSelectionParams.selected ? UIHelper.styleText(data.name, UI_STYLES.LIST_ITEM_SELECTED) : data.name;
    return {
      service: 'bandcamp',
      type: 'item-no-menu',
      title,
      icon: listSelectionParams.selected ? 'fa fa-check' : 'fa',
      uri: listSelectionParams.uri
    };
  }

  renderGenreListItem(data: TagEntity): RenderedListItem | null {
    const tagView: TagView = {
      name: 'tag',
      tagUrl: data.url
    };
    return {
      service: 'bandcamp',
      type: 'folder',
      title: data.name,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(tagView)}`
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
