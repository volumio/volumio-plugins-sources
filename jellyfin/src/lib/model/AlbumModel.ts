import { EntityType } from '../entities';
import Album from '../entities/Album';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import AlbumParser from './parser/AlbumParser';

export default class AlbumModel extends BaseModel {

  getAlbums(params: GetItemsParams): Promise<GetItemsResult<Album>> {
    const parser = new AlbumParser();
    return this.getItemsFromAPI<Album>({ ...params, itemTypes: EntityType.Album }, parser);
  }

  getAlbum(id: string) {
    const parser = new AlbumParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
