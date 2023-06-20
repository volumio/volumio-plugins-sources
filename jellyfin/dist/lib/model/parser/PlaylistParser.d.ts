import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Playlist from '../../entities/Playlist';
import BaseParser from './BaseParser';
export default class PlaylistParser extends BaseParser<Playlist> {
    parseDto(data: BaseItemDto, api: Api): Promise<Playlist | null>;
}
//# sourceMappingURL=PlaylistParser.d.ts.map