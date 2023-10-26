import { PageElement } from '../../../types';
import BaseViewHandler from './BaseViewHandler';
import View, { ContinuationBundle } from './View';
import { RenderedPage } from './ViewHandler';
export interface OptionSelectionView extends View {
    name: 'optionSelection';
    fromContinuationBundle?: '1';
    continuationBundle?: ContinuationBundle;
    targetKey?: string;
    option?: PageElement.Option;
    genericViewUri?: string;
}
export default class OptionSelectionViewHandler extends BaseViewHandler<OptionSelectionView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=OptionSelectionViewHandler.d.ts.map