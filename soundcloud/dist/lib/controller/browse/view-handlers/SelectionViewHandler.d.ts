import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface SelectionView extends View {
    name: 'selections';
    selectionId?: string;
}
export default class SelectionViewHandler extends BaseViewHandler<SelectionView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=SelectionViewHandler.d.ts.map