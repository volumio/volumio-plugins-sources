import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Artist from '../../entities/Artist';
import BaseParser from './BaseParser';
export default class ArtistParser extends BaseParser<Artist> {
    #private;
    constructor(type: EntityType.Artist | EntityType.AlbumArtist);
    parseDto(data: BaseItemDto, api: Api): Promise<Artist | null>;
}
//# sourceMappingURL=ArtistParser.d.ts.map