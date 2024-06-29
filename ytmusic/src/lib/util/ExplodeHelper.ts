import ytmusic from '../YTMusicContext';
import { ExplodedTrackInfo, QueueItem } from '../controller/browse/view-handlers/ExplodableViewHandler';
import { GenericView } from '../controller/browse/view-handlers/GenericViewHandler';
import { MusicItemView } from '../controller/browse/view-handlers/MusicItemViewHandler';
import View from '../controller/browse/view-handlers/View';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import { ContentItem } from '../types';
import { EndpointType, WatchContinuationEndpoint, WatchEndpoint } from '../types/Endpoint';
import EndpointHelper from './EndpointHelper';

export default class ExplodeHelper {

  // Creates a bundle that contains the data needed by explode() to
  // Generate the final exploded item.
  static getExplodedTrackInfoFromMusicItem(data: ContentItem.MusicItem): ExplodedTrackInfo {
    const result: ExplodedTrackInfo = {
      type: data.type,
      title: data.title,
      artist: data.artistText || '',
      album: data.album?.title || '',
      albumart: data.thumbnail || '',
      endpoint: data.endpoint // Watch endpoint
    };
    if (data.autoplayContext) {
      result.autoplayContext = data.autoplayContext;
    }
    return result;
  }

  static getExplodedTrackInfoFromUri(uri?: string | null): ExplodedTrackInfo | null {
    if (!uri) {
      return null;
    }

    const trackView = ViewHelper.getViewsFromUri(uri)[1] as MusicItemView;

    if (!trackView || (trackView.name !== 'video' && trackView.name !== 'song') ||
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

    if (view.noExplode) {
      return true;
    }

    /**
     * Pre-v1.0 URIs do not have
     */
    switch (view.name) {
      case 'video':
      case 'song':
        // ExplodeTrackData must be an object (pre-v1.0 is stringified)
        return view.explodeTrackData && typeof view.explodeTrackData === 'object';

      case 'playlist':
      case 'album':
        // Endpoints object must exist (pre-v1.0 is just albumId / playlistId)
        return view.endpoints && typeof view.endpoints === 'object';

      case 'generic':
        // Endpoint must be an object (pre-v1.0 is stringified)
        return view.endpoint && typeof view.endpoint === 'object';

      default:
        return false;
    }
  }

  /**
   * Converts a legacy URI (pre-v1.0) to one that current version can explode.
   * Legacy URI:
   * - song[@explodeTrackData=...]
   * - video[@explodeTrackData=...]
   * - album[@albumId=...]
   * - artist[@artistId=...]
   * - playlist[@playlistId=...]
   * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
   * @param {*} uri
   * @returns Converted URI or `null` on failure
   */
  static async convertLegacyExplodeUri(uri: string) {
    // Current view
    const view = ViewHelper.getViewsFromUri(uri).pop();

    if (!view) {
      return null;
    }

    let targetView: View | null = null;

    // Conversion from pre-v1.0
    if ((view.name === 'video' && view.videoId) ||
      (view.name === 'song' && view.songId)) {

      let explodeTrackData;
      try {
        explodeTrackData = JSON.parse(decodeURIComponent(view.explodeTrackData));
      }
      catch (error) {
        explodeTrackData = view.explodeTrackData;
      }
      if (typeof explodeTrackData !== 'object') {
        ytmusic.getLogger().error('[ytmusic] Failed to obtain explodeTrackData from legacy URI');
        return null;
      }

      const { videoId, album, albumart, artist, title, playlistId, autoplayContext } = explodeTrackData;
      if (!videoId || !title || !playlistId) {
        ytmusic.getLogger().error('[ytmusic] Incomplete explodeTrackData from legacy URI');
        return null;
      }

      const endpoint: WatchEndpoint = {
        type: EndpointType.Watch,
        payload: {
          videoId,
          playlistId
        }
      };

      const convertedExplodeTrackData: ExplodedTrackInfo = {
        type: view.name,
        title,
        album,
        artist,
        albumart,
        endpoint
      };

      if (autoplayContext?.playlistId) {
        const { playlistId, params, continuation, continueFromVideoId } = autoplayContext;
        let fetchEndpoint: WatchEndpoint | WatchContinuationEndpoint;
        if (continuation) {
          fetchEndpoint = {
            type: EndpointType.WatchContinuation,
            payload: {
              token: continuation,
              playlistId
            }
          };
        }
        else {
          fetchEndpoint = {
            type: EndpointType.Watch,
            payload: {
              playlistId
            }
          };
        }
        if (params) {
          fetchEndpoint.payload.params = params;
        }
        if (continueFromVideoId) {
          fetchEndpoint.payload.videoId = continueFromVideoId;
        }
        convertedExplodeTrackData.autoplayContext = {
          fetchEndpoint
        };
      }

      const musicItemView: MusicItemView = {
        name: view.name,
        explodeTrackData: convertedExplodeTrackData
      };
      targetView = musicItemView;
    }
    else if (view.name === 'playlist' && view.playlistId) {
      let playlistId = decodeURIComponent(view.playlistId);
      if (playlistId.startsWith('VL')) {
        playlistId = playlistId.substring(2);
      }
      const genericView: GenericView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Watch,
          payload: {
            playlistId: decodeURIComponent(playlistId)
          }
        }
      };
      targetView = genericView;
    }
    else if (view.name === 'album' && view.albumId) {
      const genericView: GenericView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Browse,
          payload: {
            browseId: decodeURIComponent(view.albumId)
          }
        }
      };
      targetView = genericView;
    }
    else if (view.name === 'artist' && view.artistId) {
      const genericView: GenericView = {
        name: 'generic',
        endpoint: {
          type: EndpointType.Browse,
          payload: {
            browseId: decodeURIComponent(view.artistId)
          }
        }
      };
      targetView = genericView;
    }
    else if (view.name === 'generic' && view.endpoint?.actionType === 'watchPlaylist') {
      const { playlistId, params, videoId } = view.endpoint.payload || {};
      if (playlistId) {
        const endpoint: WatchEndpoint = {
          type: EndpointType.Watch,
          payload: {
            playlistId
          }
        };
        if (params) {
          endpoint.payload.params = params;
        }
        if (videoId) {
          endpoint.payload.videoId = videoId;
        }
        const genericView: GenericView = {
          name: 'generic',
          endpoint
        };
        targetView = genericView;
      }
    }

    if (targetView) {
      return ViewHelper.constructUriFromViews([ {name: 'root'}, targetView ]);
    }

    return null;
  }

  static createQueueItemFromExplodedTrackInfo(info: ExplodedTrackInfo): QueueItem {
    return {
      'service': 'ytmusic',
      'uri': this.#getUriFromExplodedTrackInfo(info),
      'albumart': info.albumart,
      'artist': info.artist,
      'album': info.album,
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
    const targetView: MusicItemView = {
      name: info.type,
      explodeTrackData: info
    };
    return `ytmusic/${ViewHelper.constructUriSegmentFromView(targetView)}`;
  }
}
