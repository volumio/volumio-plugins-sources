import { EntityType } from '.';
import BaseEntity from './BaseEntity';

export enum FolderType {
  Collections = 'Collections',
  Folder = 'Folder'
}

interface Folder extends BaseEntity {
  type: EntityType.Folder | EntityType.CollectionFolder;
  folderType?: FolderType;
}

export default Folder;
