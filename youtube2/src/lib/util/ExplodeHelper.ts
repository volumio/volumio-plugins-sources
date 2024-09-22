import yt2 from '../YouTube2Context';
import { ExplodedTrackInfo, QueueItem } from '../controller/browse/view-handlers/ExplodableViewHandler';
import { GenericView } from '../controller/browse/view-handlers/GenericViewHandler';
import { VideoView } from '../controller/browse/view-handlers/VideoViewHandler';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import Model, { ModelType } from '../model';
import { ContentItem } from '../types';
import { EndpointType } from '../types/Endpoint';
import EndpointHelper from './EndpointHelper';

export default class ExplodeHelper {

  // Creates a bundle that contains the data needed by explode() to
  // Generate the final exploded item.
  static getExplodedTrackInfoFromVideo(data: ContentItem.Video): ExplodedTrackInfo {
    return {
      title: data.title,
      artist: data.author?.name || data.viewCount || '',
      albumart: data.thumbnail || '',
      endpoint: data.endpoint
    };
  }

  static getExplodedTrackInfoFromUri(uri: string): ExplodedTrackInfo | null {
    if (!uri) {
      return null;
    }

    const trackView = ViewHelper.getViewsFromUri(uri)[1] as VideoView;

    if (!trackView || trackView.name !== 'video' ||
      !EndpointHelper.isType(trackView.explodeTrackData?.endpoint, EndpointType.Watch)) {
      return null;
    }

    return trackView.explodeTrackData;
  }

  static validateExplodeUri(uri: string) {
    // Current view
    const view = ViewHelper.getViewsFromUri(uri).pop();

    if (!view) {
      return false;
    }

    /**
     * Pre v1.0: required param does not exist
     * v1.0.x: required param is not an object (because it is not converted when
     *           constructing View from URI)
     */
    switch (view.name) {
      case 'video':
        return view.explodeTrackData && typeof view.explodeTrackData === 'object';

      case 'playlist':
        return (view.endpoint && typeof view.endpoint === 'object') ||
          (view.endpoints && typeof view.endpoints === 'object');

      case 'generic':
        return view.endpoint && typeof view.endpoint === 'object';

      default:
        return false;
    }
  }

  /**
   * Converts a legacy URI (pre v1.1) to one that current version can explode.
   * @param {*} uri
   * @returns Converted URI or `null` on failure
   */
  static async convertLegacyExplodeUri(uri: string) {
    // Current view
    const view = ViewHelper.getViewsFromUri(uri).pop();

    if (!view) {
      return null;
    }

    let targetView: VideoView | GenericView | null = null;

    // Conversion from pre v1.0
    if (view.name === 'video' && view.videoId) {
      const model = Model.getInstance(ModelType.Video);
      const playbackInfo = await model.getPlaybackInfo(view.videoId);
      const videoInfo: any = { ...playbackInfo };

      if (playbackInfo) {
        videoInfo.endpoint = {
          type: 'watch',
          payload: {
            videoId: view.videoId
          }
        };
        if (view.fromPlaylistId) {
          videoInfo.endpoint.playlistId = view.fromPlaylistId;
        }

        targetView = {
          name: 'video',
          explodeTrackData: this.getExplodedTrackInfoFromVideo(videoInfo)
        };
      }
    }
    else if (view.name === 'videos' && view.playlistId) {
      targetView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Watch,
          payload: {
            playlistId: view.playlistId
          }
        }
      };
    }
    else if (view.name === 'playlists' && view.channelId) {
      targetView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Browse,
          payload: {
            browseId: view.channelId
          }
        }
      };
    }
    // Conversion from v1.0.x
    else if (view.name === 'video' && view.explodeTrackData && typeof view.explodeTrackData !== 'object') {
      targetView = {
        name: 'video',
        explodeTrackData: JSON.parse(view.explodeTrackData)
      };
    }
    else if (view.name === 'generic' && view.endpoint && typeof view.endpoint !== 'object') {
      targetView = {
        name: 'generic',
        endpoint: JSON.parse(view.endpoint)
      };
    }

    if (targetView) {
      return ViewHelper.constructUriFromViews([ {name: 'root'}, targetView ]);
    }

    return null;
  }

  static createQueueItemFromExplodedTrackInfo(info: ExplodedTrackInfo): QueueItem {
    return {
      'service': 'youtube2',
      'uri': this.#getUriFromExplodedTrackInfo(info),
      'albumart': info.albumart,
      'artist': info.artist,
      'album': yt2.getI18n('YOUTUBE2_TITLE'),
      'name': info.title,
      'title': info.title
    };
  }

  static #getUriFromExplodedTrackInfo(info: ExplodedTrackInfo) {
    /**
     * `explodeTrackData` - necessary because Volumio adds track uri in
     * its own playlist / favorites / Last 100, and explodes them again when
     * played.
     */
    const targetView: VideoView = {
      name: 'video',
      endpoint: info.endpoint,
      explodeTrackData: info
    };
    return `youtube2/${ViewHelper.constructUriSegmentFromView(targetView)}`;
  }
}
