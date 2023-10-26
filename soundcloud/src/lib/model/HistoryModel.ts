import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import { Playlist, Constants, SystemPlaylist, PlayHistoryItem, Album, Track } from 'soundcloud-fetch';
import Mapper from './Mapper';
import TrackEntity from '../entities/TrackEntity';
import PlaylistEntity from '../entities/PlaylistEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackHelper from '../util/TrackHelper';

export interface HistoryModelGetPlayHistoryItemsParams {
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
  type: 'set' | 'track';
}

interface GetPlayHistoryItemsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  type: 'set' | 'track';
}

export default class HistoryModel extends BaseModel {

  getPlayHistory(params: HistoryModelGetPlayHistoryItemsParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<PlayHistoryItem>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<PlayHistoryItem>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getPlayHistoryFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedPlayHistoryItemToEntity.bind(this),
      onEnd: this.#onGetPlayHistoryLoopFetchEnd.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getPlayHistoryFetchPromise(params: GetPlayHistoryItemsLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<PlayHistoryItem>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams = {
      type: params.type,
      limit: Constants.QUERY_MAX_LIMIT
    };
    return api.me.getPlayHistory(queryParams);
  }

  async #convertFetchedPlayHistoryItemToEntity(item: PlayHistoryItem): Promise<AlbumEntity | PlaylistEntity | TrackEntity | null> {
    const wrappedItem = item.item;
    if (wrappedItem instanceof Album) {
      return Mapper.mapAlbum(wrappedItem);
    }
    else if (wrappedItem instanceof Playlist || wrappedItem instanceof SystemPlaylist) {
      return Mapper.mapPlaylist(wrappedItem);
    }
    else if (wrappedItem instanceof Track) {
      return Mapper.mapTrack(wrappedItem);
    }
    return null;
  }

  #onGetPlayHistoryLoopFetchEnd(result: LoopFetchResult<AlbumEntity | PlaylistEntity | TrackEntity>) {
    const tracks = result.items.filter((item) => item.type === 'track') as TrackEntity[];
    TrackHelper.cacheTracks(tracks, this.getCacheKeyForFetch.bind(this, 'track'));
    return result;
  }
}
