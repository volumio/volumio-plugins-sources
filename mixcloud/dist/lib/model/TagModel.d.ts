import { SearchAPI } from 'mixcloud-fetch';
import BaseModel, { CommonModelPaginationParams } from './BaseModel';
import { SlugEntity } from '../entities/SlugEntity';
export interface TagModelGetTagsParams extends CommonModelPaginationParams {
    keywords: string;
}
export type GetTagsFetchResult = Awaited<ReturnType<SearchAPI['getTags']>>;
export default class TagModel extends BaseModel {
    #private;
    getTags(params: TagModelGetTagsParams): Promise<{
        params: {
            limit: number;
            pageToken: string | undefined;
        };
        items: SlugEntity[];
        nextPageToken: string | null;
        nextPageOffset: number;
    }>;
}
//# sourceMappingURL=TagModel.d.ts.map