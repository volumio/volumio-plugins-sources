import { TagAPI, TagAPIGetFeaturedParams, TagAPIGetShowsParams } from 'mixcloud-fetch';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import { CloudcastEntity } from '../entities/CloudcastEntity';
import { SlugEntity } from '../entities/SlugEntity';
export type DiscoverType = 'all' | 'featured';
export interface DiscoverOptionValues<T extends DiscoverType> {
    slug: string;
    orderBy: DiscoverResultsOrderBy<T>;
    country: string;
}
export type DiscoverResultsOrderBy<T extends DiscoverType> = T extends 'all' ? NonNullable<TagAPIGetShowsParams['orderBy']> : T extends 'featured' ? NonNullable<TagAPIGetFeaturedParams['orderBy']> : never;
export type DiscoverModelDiscoverParams<T extends DiscoverType> = CommonModelPaginationParams & (T extends 'all' ? {
    list: 'all';
    slug?: string;
    orderBy?: DiscoverResultsOrderBy<'all'>;
    country?: string;
} : T extends 'featured' ? {
    list: 'featured';
    slug?: string;
    orderBy?: DiscoverResultsOrderBy<'featured'>;
} : never);
export type DiscoverFetchResult<T extends DiscoverType> = T extends 'all' ? NonNullable<Awaited<ReturnType<TagAPI['getShows']>>> : T extends 'featured' ? NonNullable<Awaited<ReturnType<TagAPI['getFeatured']>>> : never;
export interface DiscoverLoopFetchResult<T extends DiscoverType> extends LoopFetchResult<CloudcastEntity> {
    params: DiscoverFetchResult<T>['params'];
    selectedTags: SlugEntity[];
}
export default class DiscoverModel extends BaseModel {
    #private;
    getDiscoverResults<T extends DiscoverType>(params: DiscoverModelDiscoverParams<T>): Promise<DiscoverLoopFetchResult<T>>;
    getCategories(): Promise<Record<string, SlugEntity[]>>;
    getCountries(): Promise<import("mixcloud-fetch").CountryBundle>;
    getDiscoverOptions<T extends DiscoverType>(target: {
        list: T;
        orderBy?: DiscoverResultsOrderBy<T>;
    }): Promise<OptionBundle<DiscoverOptionValues<T>>>;
}
//# sourceMappingURL=DiscoverModel.d.ts.map