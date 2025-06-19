import { BaseModel } from './BaseModel';
import type Endpoint from '../types/Endpoint';
import { type ContentOf } from '../types/Content';
export default class EndpointModel extends BaseModel {
    #private;
    getContents<T extends Endpoint>(endpoint: T): Promise<ContentOf<T> | null>;
}
//# sourceMappingURL=EndpointModel.d.ts.map