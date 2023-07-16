import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Artist from '../../entities/Artist';
import BaseParser from './BaseParser';

export default class ArtistParser extends BaseParser<Artist> {

  #type: EntityType.Artist | EntityType.AlbumArtist;

  constructor(type: EntityType.Artist | EntityType.AlbumArtist) {
    super();
    this.#type = type;
  }

  async parseDto(data: BaseItemDto, api: Api): Promise<Artist | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    return {
      ...base,
      type: this.#type,
      genres: this.getGenres(data)
    };
  }
}
