import { BaseModel } from './BaseModel';
import { type PageContent } from '../types/Content';
export default class RootModel extends BaseModel {
    #private;
    getContents(opts?: {
        contentType: 'simple' | 'full';
    }): Promise<PageContent | null>;
}
//# sourceMappingURL=RootModel.d.ts.map