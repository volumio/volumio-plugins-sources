import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import UIHelper from '../../../../util/UIHelper';
import TrackEntity from '../../../../entities/TrackEntity';
import { TrackView } from '../TrackViewHandler';
import ViewHelper from '../ViewHelper';

export default class TrackRenderer extends BaseRenderer<TrackEntity> {

  renderToListItem(data: TrackEntity, addType = false, fakeAlbum = false, addNonPlayableText = true): RenderedListItem | null {
    if (!data.url) {
      return null;
    }

    const trackView: TrackView = {
      name: 'track',
      trackUrl: data.url
    };
    const result: RenderedListItem = {
      service: 'bandcamp',
      type: fakeAlbum ? 'folder' : 'song',
      title: addType ? this.addType('track', data.name) : data.name,
      artist: data.artist?.name,
      album: data.album?.name,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(trackView)}`,
      albumart: data.thumbnail
    };

    if (!fakeAlbum) {
      result.duration = data.duration;
    }
    if (!data.streamUrl && addNonPlayableText) {
      result.title = UIHelper.addNonPlayableText(result.title);
    }

    return result;
  }

  renderToHeader(data: TrackEntity): RenderedHeader | null {
    return {
      service: 'bandcamp',
      uri: this.uri,
      type: 'song',
      album: data.name,
      artist: data.artist?.name,
      albumart: data.thumbnail
    };
  }
}
