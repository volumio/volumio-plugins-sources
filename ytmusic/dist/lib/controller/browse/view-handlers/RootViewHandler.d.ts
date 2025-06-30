import BaseViewHandler from './BaseViewHandler';
import type View from './View';
import { type RenderedPage } from './ViewHandler';
export interface RootView extends View {
    name: 'root';
}
export default class RootViewHandler extends BaseViewHandler<RootView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=RootViewHandler.d.ts.map