import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

interface Parser<T> {
  parseDto(data: BaseItemDto, api: Api): Promise<T | null>;
}

export default Parser;
