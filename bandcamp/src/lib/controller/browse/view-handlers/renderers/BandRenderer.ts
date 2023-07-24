import bandcamp from '../../../../BandcampContext';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import LabelEntity from '../../../../entities/LabelEntity';
import ArtistEntity from '../../../../entities/ArtistEntity';
import BandEntity from '../../../../entities/BandEntity';
import { BandView } from '../BandViewHandler';
import ViewHelper from '../ViewHelper';

export default class BandRenderer extends BaseRenderer<ArtistEntity | LabelEntity> {

  renderToListItem(data: ArtistEntity | LabelEntity | BandEntity): RenderedListItem | null {
    if (!data.url) {
      return null;
    }
    const bandView: BandView = {
      name: 'band',
      bandUrl: data.url
    };
    const result: RenderedListItem = {
      service: 'bandcamp',
      type: 'folder',
      title: data.name,
      albumart: data.thumbnail,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(bandView)}`
    };
    if (data.location) {
      result.artist = data.location;
    }
    return result;
  }

  renderToHeader(data: ArtistEntity | LabelEntity): RenderedHeader | null {
    const result: RenderedHeader = {
      uri: this.uri,
      service: 'bandcamp',
      type: 'song',
      title: data.name,
      albumart: data.thumbnail
    };
    switch (data.type) {
      case 'artist':
        result.artist = bandcamp.getI18n('BANDCAMP_HEADER_ARTIST');
        break;
      case 'label':
        result.artist = bandcamp.getI18n('BANDCAMP_HEADER_LABEL');
        break;
      default:
    }
    if (data.location) {
      result.year = data.location;
    }
    if (data.type === 'artist' && data.label) {
      result.duration = data.label.name;
    }
    return result;
  }
}
