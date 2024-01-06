import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface CollectionView extends View {
    name: 'collection';
    parentId: string;
    itemType?: 'album' | 'artist' | 'playlist' | 'song';
}
export default class CollectionViewHandler extends BaseViewHandler<CollectionView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=CollectionViewHandler.d.ts.map