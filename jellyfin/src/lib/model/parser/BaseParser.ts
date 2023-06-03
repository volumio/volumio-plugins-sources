import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import Parser from './Parser';
import BaseEntity from '../../entities/BaseEntity';
import { EntityType } from '../../entities';

export default abstract class BaseParser<T extends BaseEntity> implements Parser<BaseEntity> {

  async parseDto(data: BaseItemDto, api: Api): Promise<T | BaseEntity | null> {
    if (!data.Id || !data.Name) {
      return null;
    }

    const result: BaseEntity = {
      type: EntityType.Unknown,
      id: data.Id,
      name: data.Name,
      thumbnail: await this.getThumbnailUrl(data, api)
    };

    return result;
  }

  async getThumbnailUrl(data: BaseItemDto, api: Api): Promise<string | null> {
    if (!data.Id || !data.ImageTags?.Primary) {
      return null;
    }

    return api.getItemImageUrl(data.Id, ImageType.Primary, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 90
    }) || null;
  }

  protected ticksToSeconds(ticks: number) {
    if (ticks) {
      return Math.floor(ticks / 10000000);
    }
    return 0;
  }

  protected getGenres(data: BaseItemDto): { id: string, name: string }[] {
    return data.GenreItems?.map((genre) => ({
      id: genre.Id,
      name: genre.Name
    }) as any).filter((genre) => genre.id && genre.name) || [];
  }
}
