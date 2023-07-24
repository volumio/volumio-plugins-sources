import { Api } from '@jellyfin/sdk';
import { UserViewsApi } from '@jellyfin/sdk/lib/generated-client/api/user-views-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import UserView from '../entities/UserView';
import BaseModel, { GetItemsResult } from './BaseModel';
import UserViewParser from './parser/UserViewParser';

export default class UserViewModel extends BaseModel {

  getUserViews(): Promise<GetItemsResult<UserView>> {
    const parser = new UserViewParser();
    return this.getItemsFromAPI<UserView, UserViewsApi>({}, parser, {
      getApi: (api: Api) => getUserViewsApi(api),
      getItems: 'getUserViews'
    });
  }

  getUserView(id: string) {
    const parser = new UserViewParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
