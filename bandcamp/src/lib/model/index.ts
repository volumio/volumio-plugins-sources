import bcfetch from 'bandcamp-fetch';
import AlbumModel from './AlbumModel';
import ArticleModel from './ArticleModel';
import BandModel from './BandModel';
import DiscoverModel from './DiscoverModel';
import FanModel from './FanModel';
import SearchModel from './SearchModel';
import ShowModel from './ShowModel';
import TagModel from './TagModel';
import TrackModel from './TrackModel';

export enum ModelType {
  Album = 'Album',
  Article = 'Article',
  Band = 'Band',
  Discover = 'Discover',
  Fan = 'Fan',
  Search = 'Search',
  Show = 'Show',
  Tag = 'Tag',
  Track = 'Track'
}

const MODEL_TYPE_TO_CLASS: Record<any, any> = {
  [ModelType.Album]: AlbumModel,
  [ModelType.Article]: ArticleModel,
  [ModelType.Band]: BandModel,
  [ModelType.Discover]: DiscoverModel,
  [ModelType.Fan]: FanModel,
  [ModelType.Search]: SearchModel,
  [ModelType.Show]: ShowModel,
  [ModelType.Tag]: TagModel,
  [ModelType.Track]: TrackModel
};

export default class Model {

  static getInstance(type: ModelType.Album): AlbumModel;
  static getInstance(type: ModelType.Article): ArticleModel;
  static getInstance(type: ModelType.Band): BandModel;
  static getInstance(type: ModelType.Discover): DiscoverModel;
  static getInstance(type: ModelType.Fan): FanModel;
  static getInstance(type: ModelType.Search): SearchModel;
  static getInstance(type: ModelType.Show): ShowModel;
  static getInstance(type: ModelType.Tag): TagModel;
  static getInstance(type: ModelType.Track): TrackModel;
  static getInstance(type: ModelType) {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type]();
    }
    throw Error(`Model not found for type ${ModelType}`);
  }

  static setCookie(value?: string | null) {
    bcfetch.setCookie(value);
  }

  static get cookie() {
    return bcfetch.cookie;
  }

  static reset() {
    bcfetch.setCookie();
    this.clearLibCache();
  }

  static clearLibCache() {
    bcfetch.cache.clear();
  }

  static async ensureStreamURL(url: string) {
    const testResult = await bcfetch.stream.test(url);
    if (testResult.ok) {
      return url;
    }
    return await bcfetch.stream.refresh(url);
  }
}
