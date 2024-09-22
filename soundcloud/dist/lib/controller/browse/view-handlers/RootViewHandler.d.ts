import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export type RootView = View;
export default class RootViewHandler extends BaseViewHandler<RootView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=RootViewHandler.d.ts.map