import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Genre from '../../entities/Genre';
import BaseParser from './BaseParser';
export default class GenreParser extends BaseParser<Genre> {
    parseDto(data: BaseItemDto, api: Api): Promise<Genre | null>;
}
//# sourceMappingURL=GenreParser.d.ts.map