import { ContentItem } from '../../../../types';
import ExplodeHelper from '../../../../util/ExplodeHelper';
import { VideoView } from '../VideoViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

export default class VideoRenderer extends BaseRenderer<ContentItem.Video> {

  renderToListItem(data: ContentItem.Video): RenderedListItem | null {
    const explodeTrackData = ExplodeHelper.getExplodedTrackInfoFromVideo(data);
    const targetView: VideoView = {
      name: 'video',
      explodeTrackData: ExplodeHelper.getExplodedTrackInfoFromVideo(data)
    };
    return {
      service: 'youtube2',
      type: 'song',
      title: explodeTrackData.title,
      artist: explodeTrackData.artist,
      albumart: explodeTrackData.albumart,
      duration: data.duration,
      uri: `youtube2/${ViewHelper.constructUriSegmentFromView(targetView)}`
    };
  }
}
