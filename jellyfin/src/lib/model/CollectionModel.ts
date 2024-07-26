import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { EntityType } from '../entities';
import Album from '../entities/Album';
import Artist from '../entities/Artist';
import Collection from '../entities/Collection';
import Playlist from '../entities/Playlist';
import Song from '../entities/Song';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import AlbumParser from './parser/AlbumParser';
import ArtistParser from './parser/ArtistParser';
import CollectionParser from './parser/CollectionParser';
import PlaylistParser from './parser/PlaylistParser';
import SongParser from './parser/SongParser';

export interface GetCollectionItemsParams extends Omit<GetItemsParams, 'itemTypes'> {
  itemType: EntityType.Album | EntityType.Artist | EntityType.Playlist | EntityType.Song;
}

export default class CollectionModel extends BaseModel {

  getCollections(params: GetItemsParams): Promise<GetItemsResult<Collection>> {
    const parser = new CollectionParser();
    const overrideParams = {
      ...params,
      recursive: false,
      sortBy: [ ItemSortBy.IsFolder, ItemSortBy.SortName ],
      sortOrder: SortOrder.Ascending
    };
    return this.getItemsFromAPI<Collection>(overrideParams, parser);
  }

  getCollectionItems(params: GetCollectionItemsParams): Promise<GetItemsResult<Album | Artist | Playlist | Song>>;
  getCollectionItems(params: GetCollectionItemsParams & {itemType: EntityType.Song}): Promise<GetItemsResult<Song>>;
  getCollectionItems(params: GetCollectionItemsParams & {itemType: EntityType.Playlist}): Promise<GetItemsResult<Playlist>>;
  getCollectionItems(params: GetCollectionItemsParams & {itemType: EntityType.Artist}): Promise<GetItemsResult<Artist>>;
  getCollectionItems(params: GetCollectionItemsParams & {itemType: EntityType.Album}): Promise<GetItemsResult<Album>>;
  getCollectionItems(params: GetCollectionItemsParams): Promise<GetItemsResult<Album | Artist | Playlist | Song>> {
    let parser;
    switch (params.itemType) {
      case EntityType.Album:
        parser = new AlbumParser();
        break;

      case EntityType.Artist:
        parser = new ArtistParser(EntityType.Artist);
        break;

      case EntityType.Playlist:
        parser = new PlaylistParser();
        break;

      case EntityType.Song:
        parser = new SongParser();
        break;

      default:
        parser = null;
    }

    if (!parser) {
      throw Error('Unknown item type');
    }

    const normalizedParams: GetItemsParams = {
      ...params,
      recursive: false,
      sortBy: null,
      sortOrder: null,
      itemTypes: [ params.itemType ]
    };

    if (params.itemType === EntityType.Playlist) {
      /**
       * We can't pass `itemType` like we did for other entity types. Jellyfin will
       * somehow return the wrong data. Instead, we use `excludeItemTypes`.
       * We assume the items returned are playlists, because it seems you can only add
       * Albums, Artists and Playlists to a Collection.
       */
      delete normalizedParams.itemTypes;
      normalizedParams.excludeItemTypes = 'Album,Artist,Song';
    }

    return this.getItemsFromAPI<Album | Artist | Playlist | Song>(normalizedParams, parser);
  }

  getCollection(id: string) {
    const parser = new CollectionParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
