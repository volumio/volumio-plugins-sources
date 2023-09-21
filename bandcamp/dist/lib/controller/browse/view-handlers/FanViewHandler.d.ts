import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface FanView extends View {
    name: 'fan';
    username: string;
    view?: 'collection' | 'wishlist' | 'followingArtistsAndLabels' | 'followingGenres';
}
export default class FanViewHandler extends BaseViewHandler<FanView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=FanViewHandler.d.ts.map