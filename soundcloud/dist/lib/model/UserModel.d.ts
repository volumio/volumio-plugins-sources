import BaseModel from './BaseModel';
import UserEntity from '../entities/UserEntity';
export interface UserModelGetUsersParams {
    search?: string;
    myFollowing?: boolean;
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
}
export default class UserModel extends BaseModel {
    #private;
    getUsers(params: UserModelGetUsersParams): Promise<import("./BaseModel").LoopFetchResult<UserEntity>>;
    getUser(userId: number): Promise<UserEntity | null>;
}
//# sourceMappingURL=UserModel.d.ts.map