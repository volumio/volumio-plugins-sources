import { Api } from '@jellyfin/sdk';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import UserView, { UserViewType } from '../../entities/UserView';
import BaseParser from './BaseParser';

export default class UserViewParser extends BaseParser<UserView> {

  async parseDto(data: BaseItemDto, api: Api): Promise<UserView | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const result: UserView = {
      ...base,
      type: EntityType.UserView
    };

    if (data.Type === BaseItemKind.CollectionFolder && data.CollectionType === 'boxsets') {
      result.userViewType = UserViewType.Collections;
    }
    else if (data.Type === BaseItemKind.UserView && data.CollectionType === 'playlists') {
      result.userViewType = UserViewType.Playlists;
    }
    else if (data.Type === BaseItemKind.CollectionFolder && data.CollectionType === 'music') {
      result.userViewType = UserViewType.Library;
    }
    else if (data.Type === BaseItemKind.UserView && data.CollectionType === 'folders') {
      result.userViewType = UserViewType.Folders;
    }
    else {
      return null;
    }

    return result;
  }
}
