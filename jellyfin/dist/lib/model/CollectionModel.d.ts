import { EntityType } from '../entities';
import Album from '../entities/Album';
import Artist from '../entities/Artist';
import Collection from '../entities/Collection';
import Playlist from '../entities/Playlist';
import Song from '../entities/Song';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
export interface GetCollectionItemsParams extends Omit<GetItemsParams, 'itemTypes'> {
    itemType: EntityType.Album | EntityType.Artist | EntityType.Playlist | EntityType.Song;
}
export default class CollectionModel extends BaseModel {
    getCollections(params: GetItemsParams): Promise<GetItemsResult<Collection>>;
    getCollectionItems(params: GetCollectionItemsParams): Promise<GetItemsResult<Album | Artist | Playlist | Song>>;
    getCollectionItems(params: GetCollectionItemsParams & {
        itemType: EntityType.Song;
    }): Promise<GetItemsResult<Song>>;
    getCollectionItems(params: GetCollectionItemsParams & {
        itemType: EntityType.Playlist;
    }): Promise<GetItemsResult<Playlist>>;
    getCollectionItems(params: GetCollectionItemsParams & {
        itemType: EntityType.Artist;
    }): Promise<GetItemsResult<Artist>>;
    getCollectionItems(params: GetCollectionItemsParams & {
        itemType: EntityType.Album;
    }): Promise<GetItemsResult<Album>>;
    getCollection(id: string): Promise<Collection | null>;
}
//# sourceMappingURL=CollectionModel.d.ts.map