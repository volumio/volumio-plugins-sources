import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Folder from '../../entities/Folder';
import BaseParser from './BaseParser';
export default class FolderParser extends BaseParser<Folder> {
    parseDto(data: BaseItemDto, api: Api): Promise<Folder | null>;
}
//# sourceMappingURL=FolderParser.d.ts.map