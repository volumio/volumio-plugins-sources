import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import FolderContentParser, { FolderContentType } from './parser/FolderContentParser';
import FolderParser from './parser/FolderParser';

export default class FolderModel extends BaseModel {

  getFolderContents(params: GetItemsParams): Promise<GetItemsResult<FolderContentType>> {
    const parser = new FolderContentParser();
    return this.getItemsFromAPI<FolderContentType>({ ...params, recursive: false }, parser);
  }

  getFolder(id: string) {
    const parser = new FolderParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
