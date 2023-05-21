import ServerConnection from '../connection/ServerConnection';
import AlbumModel from './AlbumModel';
import ArtistModel from './ArtistModel';
import BaseModel from './BaseModel';
import CollectionModel from './CollectionModel';
import AZFilterModel from './filter/AZFilterModel';
import FilterFilterModel from './filter/FilterFilterModel';
import GenreFilterModel from './filter/GenreFilterModel';
import SortFilterModel from './filter/SortFilterModel';
import YearFilterModel from './filter/YearFilterModel';
import FolderModel from './FolderModel';
import GenreModel from './GenreModel';
import PlaylistModel from './PlaylistModel';
import SongModel from './SongModel';
import UserViewModel from './UserViewModel';

export enum ModelType {
  UserView = 'UserView',
  Album = 'Album',
  Playlist = 'Playlist',
  Artist = 'Artist',
  Genre = 'Genre',
  Song = 'Song',
  Collection = 'Collection',
  Folder = 'Folder',
  AZFilter = 'AZFilter',
  GenreFilter = 'GenreFilter',
  YearFilter = 'YearFilter',
  FilterFilter = 'FilterFilter',
  SortFilter = 'SortFilter'
}

const MODEL_TYPE_TO_CLASS: Record<any, typeof BaseModel> = {
  [ModelType.UserView]: UserViewModel,
  [ModelType.Album]: AlbumModel,
  [ModelType.Playlist]: PlaylistModel,
  [ModelType.Artist]: ArtistModel,
  [ModelType.Genre]: GenreModel,
  [ModelType.Song]: SongModel,
  [ModelType.Collection]: CollectionModel,
  [ModelType.Folder]: FolderModel,
  [ModelType.AZFilter]: AZFilterModel,
  [ModelType.GenreFilter]: GenreFilterModel,
  [ModelType.YearFilter]: YearFilterModel,
  [ModelType.FilterFilter]: FilterFilterModel,
  [ModelType.SortFilter]: SortFilterModel
};

export default class Model {

  static getInstance(type: ModelType.SortFilter, connection: ServerConnection): SortFilterModel;
  static getInstance(type: ModelType.FilterFilter, connection: ServerConnection): FilterFilterModel;
  static getInstance(type: ModelType.YearFilter, connection: ServerConnection): YearFilterModel;
  static getInstance(type: ModelType.GenreFilter, connection: ServerConnection): GenreFilterModel;
  static getInstance(type: ModelType.AZFilter, connection: ServerConnection): AZFilterModel;
  static getInstance(type: ModelType.Folder, connection: ServerConnection): FolderModel;
  static getInstance(type: ModelType.Collection, connection: ServerConnection): CollectionModel;
  static getInstance(type: ModelType.Song, connection: ServerConnection): SongModel;
  static getInstance(type: ModelType.Genre, connection: ServerConnection): GenreModel;
  static getInstance(type: ModelType.Artist, connection: ServerConnection): ArtistModel;
  static getInstance(type: ModelType.Playlist, connection: ServerConnection): PlaylistModel;
  static getInstance(type: ModelType.Album, connection: ServerConnection): AlbumModel;
  static getInstance(type: ModelType.UserView, connection: ServerConnection): UserViewModel;
  static getInstance(type: any, connection: ServerConnection): BaseModel {
    if (MODEL_TYPE_TO_CLASS[type]) {
      return new MODEL_TYPE_TO_CLASS[type](connection);
    }
    throw Error(`Model not found for type ${ModelType}`);
  }
}
