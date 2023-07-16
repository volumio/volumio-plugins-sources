import { BaseModel } from './BaseModel';
import PageContent from '../types/PageContent';
export default class RootModel extends BaseModel {
    #private;
    getContents(opts?: {
        contentType: 'simple' | 'full';
    }): Promise<PageContent | null>;
}
//# sourceMappingURL=RootModel.d.ts.map