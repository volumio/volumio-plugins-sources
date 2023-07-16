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

const MODEL_TYPE_TO_CLASS: Record<any, any> = {
  [ModelType.Account]: AccountModel,
  [ModelType.Config]: ConfigModel,
  [ModelType.Endpoint]: EndpointModel,
  [ModelType.Playlist]: PlaylistModel,
  [ModelType.Search]: SearchModel,
  [ModelType.Video]: VideoModel,
  [ModelType.Root]: RootModel
};

export default class Model {

  static getInstance(type: ModelType.Account): AccountModel;
  static getInstance(type: ModelType.Config): ConfigModel;
  static getInstance(type: ModelType.Endpoint): EndpointModel;
  static getInstance(type: ModelType.Playlist): PlaylistModel;
  static getInstance(type: ModelType.Search): SearchModel;
  static getInstance(type: ModelType.Video): VideoModel;
  static getInstance(type: ModelType.Root): RootModel;
  static getInstance(type: ModelType) {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type]();
    }
    throw Error(`Model not found for type ${ModelType}`);
  }
}
