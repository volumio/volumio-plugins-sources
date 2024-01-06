import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { EntityType } from '../entities';
import Song from '../entities/Song';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import SongParser from './parser/SongParser';

export default class SongModel extends BaseModel {

  getSongs(params: GetItemsParams): Promise<GetItemsResult<Song>> {
    const parser = new SongParser();
    return this.getItemsFromAPI<Song>({
      ...params,
      itemTypes: EntityType.Song,
      fields: [ ItemFields.MediaSources ]
    }, parser);
  }

  getSong(id: string) {
    const parser = new SongParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
