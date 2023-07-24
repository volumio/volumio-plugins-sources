import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Playlist from '../../entities/Playlist';
import BaseParser from './BaseParser';

export default class PlaylistParser extends BaseParser<Playlist> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Playlist | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const result: Playlist = {
      ...base,
      type: EntityType.Playlist
    };

    return result;
  }
}
