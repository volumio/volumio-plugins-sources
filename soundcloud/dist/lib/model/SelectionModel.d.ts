import BaseModel, { LoopFetchResult } from './BaseModel';
import SelectionEntity from '../entities/SelectionEntity';
export interface SelectionModelGetSelectionsParams {
    mixed?: boolean;
}
export default class SelectionModel extends BaseModel {
    #private;
    getSelections(options: SelectionModelGetSelectionsParams): LoopFetchResult<SelectionEntity> | Promise<LoopFetchResult<SelectionEntity>>;
}
//# sourceMappingURL=SelectionModel.d.ts.map