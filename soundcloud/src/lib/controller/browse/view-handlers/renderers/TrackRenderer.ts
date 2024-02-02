import sc from '../../../../SoundCloudContext';
import TrackEntity from '../../../../entities/TrackEntity';
import { TrackOrigin, TrackView } from '../TrackViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

export default class TrackRenderer extends BaseRenderer<TrackEntity> {

  renderToListItem(data: TrackEntity, origin?: TrackOrigin | null): RenderedListItem | null {
    if (typeof data.id !== 'number' || !data.id || !data.title) {
      return null;
    }

    let artistLabel: string | null | undefined;
    let albumLabel = data.album || sc.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
    switch (data.playableState) {
      case 'blocked':
        artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
        albumLabel = '';
        break;
      case 'snipped':
        artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_SNIPPED');
        if (data.user?.username) {
          artistLabel += ` ${data.user.username}`;
        }
        break;
      default:
        artistLabel = data.user?.username;
    }

    const trackView: TrackView = {
      name: 'track',
      trackId: data.id.toString()
    };
    if (origin) {
      trackView.origin = origin;
    }

    const result: RenderedListItem = {
      service: 'soundcloud',
      type: 'song',
      title: data.title,
      artist: artistLabel,
      album: albumLabel,
      albumart: data.thumbnail || this.getSoundCloudIcon(),
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(trackView)}`
    };

    if (data.duration !== undefined) {
      result.duration = Math.round(data.duration / 1000);
    }

    return result;
  }
}
