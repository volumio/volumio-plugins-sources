import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Collection from '../../entities/Collection';
import BaseParser from './BaseParser';
export default class CollectionParser extends BaseParser<Collection> {
    parseDto(data: BaseItemDto, api: Api): Promise<Collection | null>;
}
//# sourceMappingURL=CollectionParser.d.ts.map