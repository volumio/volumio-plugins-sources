import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface ArtistView extends View {
    name: 'artists' | 'albumArtists';
    parentId?: string;
    search?: string;
    collatedSearchResults?: '1';
}
export default class ArtistViewHandler extends FilterableViewHandler<ArtistView> {
    browse(): Promise<RenderedPage>;
    protected getFilterableViewConfig(): FilterableViewConfig;
}
//# sourceMappingURL=ArtistViewHandler.d.ts.map