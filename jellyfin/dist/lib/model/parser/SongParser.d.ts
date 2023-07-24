import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Song from '../../entities/Song';
import BaseParser from './BaseParser';
export default class SongParser extends BaseParser<Song> {
    parseDto(data: BaseItemDto, api: Api): Promise<Song | null>;
}
//# sourceMappingURL=SongParser.d.ts.map