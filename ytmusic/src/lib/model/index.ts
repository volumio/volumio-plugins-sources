import AccountModel from './AccountModel';
import ConfigModel from './ConfigModel';
import EndpointModel from './EndpointModel';
import MusicItemModel from './MusicItemModel';
import PlaylistModel from './PlaylistModel';
import SearchModel from './SearchModel';

export enum ModelType {
  Account = 'Account',
  Config = 'Config',
  Endpoint = 'Endpoint',
  Playlist = 'Playlist',
  Search = 'Search',
  MusicItem = 'MusicItem'
}

export type ModelOf<T extends ModelType> =
  T extends ModelType.Account ? AccountModel :
  T extends ModelType.Config ? ConfigModel :
  T extends ModelType.Endpoint ? EndpointModel :
  T extends ModelType.Playlist ? PlaylistModel :
  T extends ModelType.Search ? SearchModel :
  T extends ModelType.MusicItem ? MusicItemModel : never;

const MODEL_TYPE_TO_CLASS: Record<ModelType, any> = {
  [ModelType.Account]: AccountModel,
  [ModelType.Config]: ConfigModel,
  [ModelType.Endpoint]: EndpointModel,
  [ModelType.Playlist]: PlaylistModel,
  [ModelType.Search]: SearchModel,
  [ModelType.MusicItem]: MusicItemModel
};

export default class Model {

  static getInstance<T extends ModelType>(type: T): ModelOf<T> {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type]();
    }
    throw Error(`Model not found for type ${ModelType}`);
  }
}
