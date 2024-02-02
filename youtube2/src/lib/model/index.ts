import AccountModel from './AccountModel';
import ConfigModel from './ConfigModel';
import EndpointModel from './EndpointModel';
import PlaylistModel from './PlaylistModel';
import RootModel from './RootModel';
import SearchModel from './SearchModel';
import VideoModel from './VideoModel';

export enum ModelType {
  Account = 'Account',
  Config = 'Config',
  Endpoint = 'Endpoint',
  Playlist = 'Playlist',
  Search = 'Search',
  Video = 'Video',
  Root = 'Root'
}

export type ModelOf<T extends ModelType> =
  T extends ModelType.Account ? AccountModel :
  T extends ModelType.Config ? ConfigModel :
  T extends ModelType.Endpoint ? EndpointModel :
  T extends ModelType.Playlist ? PlaylistModel :
  T extends ModelType.Search ? SearchModel :
  T extends ModelType.Video ? VideoModel :
  T extends ModelType.Root ? RootModel : never;

const MODEL_TYPE_TO_CLASS: Record<ModelType, any> = {
  [ModelType.Account]: AccountModel,
  [ModelType.Config]: ConfigModel,
  [ModelType.Endpoint]: EndpointModel,
  [ModelType.Playlist]: PlaylistModel,
  [ModelType.Search]: SearchModel,
  [ModelType.Video]: VideoModel,
  [ModelType.Root]: RootModel
};

export default class Model {

  static getInstance<T extends ModelType>(type: T): ModelOf<T> {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type]();
    }
    throw Error(`Model not found for type ${ModelType}`);
  }
}
