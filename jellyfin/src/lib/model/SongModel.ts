import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { EntityType } from '../entities';
import Song from '../entities/Song';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import SongParser from './parser/SongParser';
import LyricsParser from './parser/LyricsParser';

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

  async getLyrics(id: string) {
    const api = getLyricsApi(this.connection.api);
    const dto = await api.getLyrics({ itemId: id });
    const parser = new LyricsParser();
    return parser.parseDto(dto.data);
  }
}
