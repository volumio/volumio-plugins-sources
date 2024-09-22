import View from './View';
import { RenderedPage } from './ViewHandler';
import { DiscoverModelDiscoverParams, DiscoverResultsOrderBy, DiscoverType } from '../../../model/DiscoverModel';
import { SlugEntity } from '../../../entities/SlugEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
export interface DiscoverView<T extends DiscoverType = 'all'> extends View {
    name: T extends 'all' ? 'discover' : T extends 'featured' ? 'featured' : never;
    slug?: string;
    orderBy?: DiscoverResultsOrderBy<T>;
    country?: T extends 'all' ? string : T extends 'featured' ? 'undefined' : never;
    select?: T extends 'all' ? 'orderBy' | 'slug' | 'country' : T extends 'featured' ? 'orderBy' | 'slug' : never;
}
export default class DiscoverViewHandler<T extends DiscoverType = 'all'> extends ExplodableViewHandler<DiscoverView<T>> {
    #private;
    browse(): Promise<RenderedPage>;
    protected getListType(): DiscoverType;
    protected getSwitchViewLinkData(selectedTags: SlugEntity[]): {
        uri: string;
        text: string;
    };
    protected getTitle(selectedTags?: SlugEntity[], orderBy?: DiscoverResultsOrderBy<any>, country?: string): string;
    protected getDiscoverModelParams(): DiscoverModelDiscoverParams<any>;
    protected getStreamableEntitiesOnExplode(): Promise<import("../../../entities/CloudcastEntity").CloudcastEntity[]>;
}
//# sourceMappingURL=DiscoverViewHandler.d.ts.map