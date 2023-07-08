import { PageElement } from '../../../../types';
import { ContinuationBundle } from '../View';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';
export interface ContinuationBundleOption {
    type: 'continuationBundleOption';
    continuationBundle: ContinuationBundle;
    targetKey: string;
}
export default class OptionRenderer extends BaseRenderer<PageElement.Option | ContinuationBundleOption> {
    #private;
    renderToListItem(data: PageElement.Option | ContinuationBundleOption): RenderedListItem | null;
}
//# sourceMappingURL=OptionRenderer.d.ts.map