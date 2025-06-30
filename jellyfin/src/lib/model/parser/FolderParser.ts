import { Api } from '@jellyfin/sdk';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Folder, { FolderType } from '../../entities/Folder';
import BaseParser from './BaseParser';

export default class FolderParser extends BaseParser<Folder> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Folder | null> {
    const base = await super.parseDto(data, api);
    if (!base || (data.Type !== BaseItemKind.Folder &&
      data.Type !== BaseItemKind.CollectionFolder && data.Type !== BaseItemKind.UserView)) {
      return null;
    }

    const result: Folder = {
      ...base,
      type: data.Type === BaseItemKind.CollectionFolder ? EntityType.CollectionFolder : EntityType.Folder
    };

    if (data.Type === BaseItemKind.CollectionFolder && data.CollectionType === 'boxsets') {
      result.folderType = FolderType.Collections;
    }
    else {
      result.folderType = FolderType.Folder;
    }

    return result;
  }
}
