import UserView from '../entities/UserView';
import BaseModel, { GetItemsResult } from './BaseModel';
export default class UserViewModel extends BaseModel {
    getUserViews(): Promise<GetItemsResult<UserView>>;
    getUserView(id: string): Promise<UserView | null>;
}
//# sourceMappingURL=UserViewModel.d.ts.map