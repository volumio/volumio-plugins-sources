import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface RootView extends View {
    name: 'root';
}
export default class RootViewHandler extends BaseViewHandler<RootView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=RootViewHandler.d.ts.map