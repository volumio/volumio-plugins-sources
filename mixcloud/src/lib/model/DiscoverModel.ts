import mcfetch, { Cloudcast, TagAPI, TagAPIGetFeaturedParams, TagAPIGetShowsParams } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle, OptionBundleEntry } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import { CloudcastEntity } from '../entities/CloudcastEntity';
import { SlugEntity } from '../entities/SlugEntity';

export type DiscoverType = 'all' | 'featured';

export interface DiscoverOptionValues<T extends DiscoverType> {
  slug: string;
  orderBy: DiscoverResultsOrderBy<T>;
  country: string;
}

export type DiscoverResultsOrderBy<T extends DiscoverType> =
  T extends 'all' ? NonNullable<TagAPIGetShowsParams['orderBy']> :
  T extends 'featured' ? NonNullable<TagAPIGetFeaturedParams['orderBy']>:
  never;

export type DiscoverModelDiscoverParams<T extends DiscoverType> =
CommonModelPaginationParams & (
  T extends 'all' ? {
    list: 'all';
    slug?: string;
    orderBy?: DiscoverResultsOrderBy<'all'>;
    country?: string;
  } :
  T extends 'featured' ? {
    list: 'featured';
    slug?: string;
    orderBy?: DiscoverResultsOrderBy<'featured'>;
  } :
  never
)

export type DiscoverFetchResult<T extends DiscoverType> =
  T extends 'all' ? NonNullable<Awaited<ReturnType<TagAPI['getShows']>>> :
  T extends 'featured' ? NonNullable<Awaited<ReturnType<TagAPI['getFeatured']>>> :
  never;

export interface DiscoverLoopFetchResult<T extends DiscoverType> extends LoopFetchResult<CloudcastEntity> {
  params: DiscoverFetchResult<T>['params'];
  selectedTags: SlugEntity[];
}

export default class DiscoverModel extends BaseModel {

  getDiscoverResults<T extends DiscoverType>(params: DiscoverModelDiscoverParams<T>) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getDiscoverFetchPromise.bind(this)<T>,
      getItemsFromFetchResult: this.#getCloudcastsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromDiscoverFetchResult.bind(this),
      convertToEntity: this.#convertFetchedCloudcastToEntity.bind(this),
      onEnd: this.#onDiscoverLoopFetchEnd.bind(this)<T>,
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getDiscoverFetchPromise<T extends DiscoverType>(params: DiscoverModelDiscoverParams<T>): Promise<DiscoverFetchResult<T>>;
  #getDiscoverFetchPromise<T extends DiscoverType>(params: DiscoverModelDiscoverParams<T>) {
    const cacheParams: Record<string, any> = {
      list: params.list,
      slug: params.slug,
      orderBy: params.orderBy,
      limit: params.limit,
      pageToken: params.pageToken
    };
    if (params.list === 'all') {
      cacheParams.country = params.country;
    }

    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('cloudcasts', cacheParams),
      async () => {
        const paginationParams = {
          limit: params.limit,
          pageToken: params.pageToken
        };
        switch (params.list) {
          case 'all':
            const fetchedAll = await mcfetch.tag(params.slug || '').getShows({
              orderBy: params.orderBy,
              country: params.country,
              ...paginationParams
            });
            if (!fetchedAll) {
              throw Error(`Tag '${params.slug}' not found`);
            }
            return fetchedAll;
          case 'featured':
            const fetchedFeatured = await mcfetch.tag(params.slug || '').getFeatured({
              orderBy: params.orderBy,
              ...paginationParams
            });
            if (!fetchedFeatured) {
              throw Error(`Tag '${params.slug}' not found`);
            }
            return fetchedFeatured;
        }
      });
  }

  #getCloudcastsFromFetchResult<T extends DiscoverType>(result: DiscoverFetchResult<T>) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromDiscoverFetchResult<T extends DiscoverType>(result: DiscoverFetchResult<T>) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
  }

  #convertFetchedCloudcastToEntity(item: Cloudcast): CloudcastEntity {
    return EntityConverter.convertCloudcast(item);
  }

  #onDiscoverLoopFetchEnd<T extends DiscoverType>(result: LoopFetchResult<CloudcastEntity>, lastFetchResult: DiscoverFetchResult<T>): DiscoverLoopFetchResult<T> {
    return {
      ...result,
      params: lastFetchResult.params,
      selectedTags: lastFetchResult.selectedTags.map((tag) => EntityConverter.convertSlugLike(tag))
    };
  }

  async getCategories() {
    const data = await mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('categories'),
      () => mcfetch.misc.getCategories());

    const result: Record<string, SlugEntity[]> = {};
    for (const [ section, categories ] of Object.entries(data)) {
      result[section] = categories.map((c) => EntityConverter.convertSlugLike(c));
    }
    return result;
  }

  getCountries() {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('countries'),
      () => mcfetch.misc.getCountries());
  }


  async getDiscoverOptions<T extends DiscoverType>(
    target: { list: T; orderBy?: DiscoverResultsOrderBy<T>; }): Promise<OptionBundle<DiscoverOptionValues<T>>>;
  async getDiscoverOptions<T extends DiscoverType>(
    target: { list: T; orderBy?: DiscoverResultsOrderBy<T>; }): Promise<OptionBundle<DiscoverOptionValues<any>>> {

    let orderBy: OptionBundleEntry<DiscoverResultsOrderBy<any>>['values'];
    switch (target.list) {
      case 'all':
        orderBy = [
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_TRENDING'), value: 'trending' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' }
        ] as OptionBundleEntry<DiscoverResultsOrderBy<'all'>>['values'];
        break;

      case 'featured':
        orderBy = [
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' }
        ];
        break;

      default:
        throw Error('getDiscoverOptions() error: bad target type');
    }

    const slug: OptionBundleEntry<string>['values'] = [];
    for (const categories of Object.values(await this.getCategories())) {
      slug.push(...categories.map((c) => ({
        name: c.name,
        value: c.slug
      })));
    }
    if (target.list === 'featured') {
      slug.unshift({
        name: mixcloud.getI18n('MIXCLOUD_ALL_CATEGORIES'),
        value: ''
      });
    }

    let country: OptionBundleEntry<string>['values'];
    if (target.list === 'all' && target.orderBy === 'trending') {
      country = (await this.getCountries()).available.map((c) => ({
        name: c.name,
        value: c.code
      }));
    }
    else {
      country = [];
    }

    return {
      slug: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_SLUG'),
        icon: 'fa fa-music',
        values: slug
      },
      orderBy: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
        icon: 'fa fa-sort',
        values: orderBy
      },
      country: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_COUNTRY'),
        icon: 'fa fa-map-marker',
        values: country
      }
    };
  }
}
