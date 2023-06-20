import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Genre from '../../entities/Genre';
import BaseParser from './BaseParser';

export default class GenreParser extends BaseParser<Genre> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Genre | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const result: Genre = {
      ...base,
      type: EntityType.Genre
    };

    return result;
  }
}
