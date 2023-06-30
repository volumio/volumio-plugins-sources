import bandcamp from '../../../../BandcampContext';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import UIHelper from '../../../../util/UIHelper';
import ShowEntity from '../../../../entities/ShowEntity';
import { ShowView } from '../ShowViewHandler';
import ViewHelper from '../ViewHelper';

export default class ShowRenderer extends BaseRenderer<ShowEntity> {

  renderToListItem(data: ShowEntity, playOnClick = false): RenderedListItem | null {
    if (!data.url) {
      return null;
    }
    const showView: ShowView = {
      name: 'show',
      showUrl: data.url
    };
    const result: RenderedListItem = {
      service: 'bandcamp',
      type: 'folder',
      title: data.name,
      artist: UIHelper.reformatDate(data.date),
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(showView)}`
    };

    if (playOnClick) {
      result.type = 'song';
      result.title = bandcamp.getI18n('BANDCAMP_SHOW_PLAY_FULL');
      result.uri = this.uri;
      result.duration = data.duration;
      delete result.artist;
    }

    return result;
  }

  renderToHeader(data: ShowEntity): RenderedHeader | null {
    return {
      'uri': this.uri,
      'service': 'bandcamp',
      'type': 'song',
      'title': data.name,
      'artist': bandcamp.getI18n('BANDCAMP_HEADER_SHOW'),
      'year': data.date,
      'duration': data.description,
      'albumart': data.thumbnail
    };
  }
}
