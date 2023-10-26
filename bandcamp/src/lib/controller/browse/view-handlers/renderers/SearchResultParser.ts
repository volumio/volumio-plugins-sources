import AlbumEntity from '../../../../entities/AlbumEntity';
import ArtistEntity from '../../../../entities/ArtistEntity';
import LabelEntity from '../../../../entities/LabelEntity';
import TrackEntity from '../../../../entities/TrackEntity';
import { AlbumView } from '../AlbumViewHandler';
import { BandView } from '../BandViewHandler';
import { TrackView } from '../TrackViewHandler';
import View from '../View';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

type SearchResultEntity = ArtistEntity | LabelEntity | AlbumEntity | TrackEntity;

export default class SearchResultRenderer extends BaseRenderer<SearchResultEntity> {

  renderToListItem(data: SearchResultEntity): RenderedListItem | null {
    if (!data.url) {
      return null;
    }
    const result: RenderedListItem = {
      service: 'bandcamp',
      uri: '',
      type: 'folder',
      title: this.addType(data.type, data.name),
      albumart: data.thumbnail
    };

    let view: View;
    switch (data.type) {
      case 'artist':
        view = {
          name: 'band',
          bandUrl: data.url
        } as BandView;
        result.type = 'folder';
        result.artist = data.location;
        break;

      case 'label':
        view = {
          name: 'band',
          bandUrl: data.url
        } as BandView;
        result.type = 'folder';
        break;

      case 'album':
        view = {
          name: 'album',
          albumUrl: data.url
        } as AlbumView;
        result.type = 'folder';
        result.artist = data.artist?.name;
        break;

      case 'track':
        view = {
          name: 'track',
          trackUrl: data.url
        } as TrackView;
        result.type = 'folder';
        result.artist = data.artist?.name;
        result.album = data.album?.name;
    }

    result.uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(view)}`;

    return result;
  }
}
