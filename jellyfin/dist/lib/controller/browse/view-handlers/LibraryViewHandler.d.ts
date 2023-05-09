import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import { ExplodedTrackInfo } from './Explodable';
export interface LibraryView extends View {
    name: 'library';
    parentId: string;
}
export default class LibraryViewHandler extends BaseViewHandler<LibraryView> {
    #private;
    browse(): Promise<RenderedPage>;
    explode(): Promise<ExplodedTrackInfo[]>;
}
//# sourceMappingURL=LibraryViewHandler.d.ts.map