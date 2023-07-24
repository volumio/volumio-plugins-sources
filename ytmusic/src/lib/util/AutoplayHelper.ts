import { ContentItem, PageElement } from '../types';
import AutoplayContext from '../types/AutoplayContext';
import { WatchContent, WatchContinuationContent } from '../types/Content';
import { EndpointType } from '../types/Endpoint';

export default class AutoplayHelper {

  static getAutoplayContext(data: PageElement.SectionItem[] | ContentItem.MusicItem | WatchContent | WatchContinuationContent): AutoplayContext | null {
    // SectionItem[]
    if (Array.isArray(data)) {
      const commonPlaylistData = this.#getCommonPlaylistData(data);
      if (commonPlaylistData) {
        return {
          fetchEndpoint: {
            type: EndpointType.Watch,
            payload: {
              ...commonPlaylistData
            }
          }
        };
      }
      return null;
    }

    // Watch / Watch Continuation Content
    if (data.type === 'watch') {
      if (data.continuation) {
        return {
          fetchEndpoint: data.continuation.endpoint
        };
      }
      if (!data.isContinuation && data.automix) {
        return {
          fetchEndpoint: data.automix.endpoint
        };
      }
      return null;
    }

    // MusicItem
    if ((data.type === 'song' || data.type === 'video')) {
      return {
        fetchEndpoint: data.endpoint
      };
    }

    return null;
  }

  static #getCommonPlaylistData(items: PageElement.SectionItem[]) {
    const hasOnlySongsAndVideos = items.length > 0 &&
      items.every((item) => item.type === 'song' || item.type === 'video');
    if (hasOnlySongsAndVideos) {
      const musicItems = items as ContentItem.MusicItem[];
      const playlistId = musicItems[0].endpoint.payload.playlistId;
      const params = musicItems[0].endpoint.payload.params;
      if (playlistId) {
        const allFromSamePlaylist = musicItems.every(
          (item) => item.endpoint.payload.playlistId === playlistId && item.endpoint.payload.params === params);
        if (allFromSamePlaylist) {
          return {
            playlistId,
            params,
            videoId: musicItems[musicItems.length - 1].videoId
          };
        }
      }
    }
    return null;
  }
}
