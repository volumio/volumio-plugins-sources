import { ContentItem } from '../../../../types';
import ExplodeHelper from '../../../../util/ExplodeHelper';
import { MusicItemView } from '../MusicItemViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

export default class MusicItemRenderer extends BaseRenderer<ContentItem.MusicItem> {

  renderToListItem(data: ContentItem.MusicItem): RenderedListItem | null {
    const explodeTrackData = ExplodeHelper.getExplodedTrackInfoFromMusicItem(data);
    const targetView: MusicItemView = {
      name: data.type,
      explodeTrackData: ExplodeHelper.getExplodedTrackInfoFromMusicItem(data)
    };
    return {
      service: 'ytmusic',
      type: 'song',
      tracknumber: data.trackNumber,
      title: data.title,
      artist: data.subtitle || explodeTrackData.artist,
      album: data.album?.title,
      albumart: data.thumbnail,
      duration: data.duration,
      uri: `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }
}
