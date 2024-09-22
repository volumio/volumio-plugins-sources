import { SearchAPI, SearchAPIGetUsersParams, UserAPIGetShowsParams } from 'mixcloud-fetch';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import { UserEntity } from '../entities/UserEntity';
export type UserOrderBy = NonNullable<UserAPIGetShowsParams['orderBy']>;
export type UserDateJoined = NonNullable<SearchAPIGetUsersParams['dateJoined']>;
export type UserType = NonNullable<SearchAPIGetUsersParams['userType']>;
export interface UserShowOptionValues {
    orderBy: UserOrderBy;
}
export interface UserSearchOptionValues {
    dateJoined: UserDateJoined;
    userType: UserType;
}
export interface UserModelGetUsersParams extends CommonModelPaginationParams {
    keywords: string;
    dateJoined?: UserDateJoined;
    userType?: UserType;
}
export type GetUsersFetchResult = Awaited<ReturnType<SearchAPI['getUsers']>>;
export interface GetUsersLoopFetchResult extends LoopFetchResult<UserEntity> {
    params: GetUsersFetchResult['params'];
}
export default class UserModel extends BaseModel {
    #private;
    getUsers(params: UserModelGetUsersParams): Promise<GetUsersLoopFetchResult>;
    getUser(username: string): Promise<UserEntity | null>;
    getShowsOptions(): OptionBundle<UserShowOptionValues>;
    getSearchOptions(): OptionBundle<UserSearchOptionValues>;
}
//# sourceMappingURL=UserModel.d.ts.map