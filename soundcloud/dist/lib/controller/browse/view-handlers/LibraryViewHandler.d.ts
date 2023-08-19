import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface LibraryView extends View {
    name: 'library';
    type: 'album' | 'playlist' | 'station';
    filter?: 'liked' | 'created' | 'all';
    selectFilter?: '1';
}
export default class LibraryViewHandler extends BaseViewHandler<LibraryView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=LibraryViewHandler.d.ts.map