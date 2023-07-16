import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Album from '../../entities/Album';
import BaseParser from './BaseParser';
export default class AlbumParser extends BaseParser<Album> {
    parseDto(data: BaseItemDto, api: Api): Promise<Album | null>;
}
//# sourceMappingURL=AlbumParser.d.ts.map