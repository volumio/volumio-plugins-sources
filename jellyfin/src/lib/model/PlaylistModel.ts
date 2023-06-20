import { EntityType } from '../entities';
import Playlist from '../entities/Playlist';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
import PlaylistParser from './parser/PlaylistParser';

export default class PlaylistModel extends BaseModel {

  async getPlaylists(params: GetItemsParams): Promise<GetItemsResult<Playlist>> {
    const parser = new PlaylistParser();
    return this.getItemsFromAPI<Playlist>({ ...params, itemTypes: EntityType.Playlist }, parser);
  }

  getPlaylist(id: string) {
    const parser = new PlaylistParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
