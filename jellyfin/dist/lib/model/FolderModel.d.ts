import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import { FolderContentType } from './parser/FolderContentParser';
export default class FolderModel extends BaseModel {
    getFolderContents(params: GetItemsParams): Promise<GetItemsResult<FolderContentType>>;
    getFolder(id: string): Promise<import("../entities/Folder").default | null>;
}
//# sourceMappingURL=FolderModel.d.ts.map