import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface DiscoverView extends View {
    name: 'discover';
    select?: 'genre' | 'subgenre' | 'sortBy' | 'artistRecommendationType' | 'location' | 'format' | 'time';
    genre?: string;
    subgenre?: string;
    sortBy?: string;
    artistRecommendationType?: string;
    location?: string;
    format?: string;
    time?: string;
}
export default class DiscoverViewHandler extends BaseViewHandler<DiscoverView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=DiscoverViewHandler.d.ts.map