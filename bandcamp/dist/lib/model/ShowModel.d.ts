import BaseModel from './BaseModel';
export interface ShowModelGetShowsParams {
    pageToken?: string;
    pageOffset?: number;
    limit: number;
}
export default class ShowModel extends BaseModel {
    #private;
    getShows(params: ShowModelGetShowsParams): Promise<import("./BaseModel").LoopFetchResult<import("../entities/ShowEntity").default>>;
    getShow(showUrl: string): Promise<import("../entities/ShowEntity").default>;
}
//# sourceMappingURL=ShowModel.d.ts.map