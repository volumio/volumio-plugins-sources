import { ModelOf, ModelType } from '../../../model';
import { PageElement } from '../../../types';
import { QueueItem } from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import ViewHandler, { RenderedPage } from './ViewHandler';
import { RendererOf, RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
export interface ContinuationData {
    continuation: PageElement.Continuation<any>;
    prevItemCount: number;
    bundle: ContinuationBundle;
}
export default class BaseViewHandler<V extends View> implements ViewHandler {
    #private;
    constructor(uri: string, currentView: V, previousViews: View[]);
    browse(): Promise<RenderedPage>;
    explode(): Promise<QueueItem[]>;
    get uri(): string;
    get currentView(): V;
    get previousViews(): View[];
    protected getModel<T extends ModelType>(type: T): ModelOf<T>;
    protected getRenderer<T extends RendererType>(type: T): RendererOf<T>;
    protected constructPrevUri(): string;
    protected constructContinuationItem(data: ContinuationData): RenderedListItem;
}
//# sourceMappingURL=BaseViewHandler.d.ts.map