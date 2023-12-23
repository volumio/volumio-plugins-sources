import mcfetch from 'mixcloud-fetch';
import CloudcastModel from './CloudcastModel';
import DiscoverModel from './DiscoverModel';
import PlaylistModel from './PlaylistModel';
import TagModel from './TagModel';
import UserModel from './UserModel';
import LiveStreamModel from './LiveStreamModel';

export enum ModelType {
  Cloudcast = 'Cloudcast',
  Discover = 'Discover',
  Playlist = 'Playlist',
  Tag = 'Tag',
  User = 'User',
  LiveStream = 'LiveStream'
}

const MODEL_TYPE_TO_CLASS: Record<any, any> = {
  [ModelType.Cloudcast]: CloudcastModel,
  [ModelType.Discover]: DiscoverModel,
  [ModelType.Playlist]: PlaylistModel,
  [ModelType.Tag]: TagModel,
  [ModelType.User]: UserModel,
  [ModelType.LiveStream]: LiveStreamModel
};

export default class Model {

  static getInstance(type: ModelType.Cloudcast): CloudcastModel;
  static getInstance(type: ModelType.Discover): DiscoverModel;
  static getInstance(type: ModelType.Playlist): PlaylistModel;
  static getInstance(type: ModelType.Tag): TagModel;
  static getInstance(type: ModelType.User): UserModel;
  static getInstance(type: ModelType.LiveStream): LiveStreamModel;
  static getInstance(type: ModelType) {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type]();
    }
    throw Error(`Model not found for type ${ModelType}`);
  }

  static reset() {
    this.clearLibCache();
  }

  static clearLibCache() {
    mcfetch.cache.clear();
  }
}
