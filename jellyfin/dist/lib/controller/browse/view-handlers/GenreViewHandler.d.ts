import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface GenreView extends View {
    name: 'genres';
    parentId: string;
}
export default class GenreViewHandler extends BaseViewHandler<GenreView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=GenreViewHandler.d.ts.map