import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Collection from '../../entities/Collection';
import BaseParser from './BaseParser';

export default class CollectionParser extends BaseParser<Collection> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Collection | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const result: Collection = {
      ...base,
      type: EntityType.Collection,
      year: data.ProductionYear || null
    };

    return result;
  }
}
