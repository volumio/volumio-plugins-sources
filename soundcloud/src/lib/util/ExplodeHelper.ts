import sc from '../SoundCloudContext';
import { ExplodedTrackInfo, QueueItem } from '../controller/browse/view-handlers/ExplodableViewHandler';
import { TrackView } from '../controller/browse/view-handlers/TrackViewHandler';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';

export default class ExplodeHelper {

  static createQueueItemFromExplodedTrackInfo(data: ExplodedTrackInfo): QueueItem | null {
    const uri = this.#getTrackUri(data);
    if (!data.title || !uri) {
      return null;
    }
    let artistLabel: string | undefined;
    let albumLabel: string | undefined = data.album || sc.getI18n('SOUNDCLOUD_TRACK_PARSER_ALBUM');
    switch (data.playableState) {
      case 'blocked':
        artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_PARSER_BLOCKED');
        albumLabel = undefined;
        break;
      case 'snipped':
        artistLabel = sc.getI18n('SOUNDCLOUD_TRACK_EXPLODE_SNIPPED');
        if (data.user?.username) {
          artistLabel += ` ${data.user.username}`;
        }
        break;
      default:
        artistLabel = data.user?.username || undefined;
    }

    const result: QueueItem = {
      service: 'soundcloud',
      uri,
      albumart: data.thumbnail || undefined,
      artist: artistLabel,
      album: albumLabel,
      name: data.title,
      title: data.title
    };

    return result;
  }

  /**
   * Track uri:
   * soundcloud/track@trackId={trackId}
   */
  static #getTrackUri(data: ExplodedTrackInfo) {
    if (data.id === undefined) {
      return null;
    }
    const trackView: TrackView = {
      name: 'track',
      trackId: data.id.toString()
    };
    if (data.origin) {
      trackView.origin = data.origin;
    }
    const uri = `soundcloud/${ViewHelper.constructUriSegmentFromView(trackView)}`;
    sc.getLogger().info(`[soundcloud] getTrackUri(): ${uri}`);
    return uri;
  }
}
