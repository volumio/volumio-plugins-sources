import { PageElement } from '../../../../types';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';
interface OptionValueRendererListItemOptions {
    extraUriParams: Record<string, any>;
}
export default class OptionValueRenderer extends BaseRenderer<PageElement.Option['optionValues'][0]> {
    #private;
    renderToListItem(data: PageElement.Option['optionValues'][0], opts?: OptionValueRendererListItemOptions): RenderedListItem | null;
}
export {};
//# sourceMappingURL=OptionValueRenderer.d.ts.map