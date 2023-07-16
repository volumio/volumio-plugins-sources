import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import Album from '../../entities/Album';
import Artist from '../../entities/Artist';
import Folder from '../../entities/Folder';
import BaseParser from './BaseParser';
import Parser from './Parser';
export type FolderContentType = Artist | Album | Folder;
export default class FolderContentParser extends BaseParser<FolderContentType> {
    #private;
    constructor();
    getParser(dtoType: BaseItemKind): Parser<FolderContentType> | null;
    parseDto(data: BaseItemDto, api: Api): Promise<FolderContentType | null>;
}
//# sourceMappingURL=FolderContentParser.d.ts.map