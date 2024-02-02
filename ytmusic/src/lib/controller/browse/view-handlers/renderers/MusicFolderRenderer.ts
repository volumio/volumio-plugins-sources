import { ContentItem, PageElement } from '../../../../types';
import { MusicFolderView } from '../MusicFolderViewHandler';
import View from '../View';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';

export default abstract class MusicFolderRenderer<T extends ContentItem.MusicFolder, K extends PageElement.MusicFolderHeader> extends BaseRenderer<T, K> {

  renderToListItem(data: T): RenderedListItem | null {
    const targetView = this.getTargetViewForListItem(data);
    if (!targetView) {
      return null;
    }
    return {
      service: 'ytmusic',
      type: 'folder',
      title: data.title,
      albumart: data.thumbnail,
      artist: this.getSubtitleForListItem(data),
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }

  renderToHeader(data: K): RenderedHeader | null {
    const targetView = this.getTargetViewForHeader(data);
    if (!targetView) {
      return null;
    }
    return {
      service: 'ytmusic',
      type: 'playlist',
      uri: `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      title: data.title,
      artist: this.getSubtitleForHeader(data),
      duration: data.subtitles?.join(' • '),
      albumart: data.thumbnail
    };
  }

  protected abstract getTargetViewForListItem(data: T): MusicFolderView | null;
  protected abstract getTargetViewForHeader(data: K): View | null;
  protected abstract getSubtitleForListItem(data: T): string | null | undefined;
  protected abstract getSubtitleForHeader(data: K): string | null | undefined;
}
