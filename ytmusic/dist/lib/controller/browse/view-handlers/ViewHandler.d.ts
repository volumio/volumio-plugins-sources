import { RenderedHeader, RenderedListItem } from './renderers/BaseRenderer';
export interface RenderedPage {
    navigation?: RenderedPageContents;
}
export interface RenderedPageContents {
    prev?: {
        uri?: string;
    };
    info?: RenderedHeader | null;
    lists?: RenderedList[];
}
export interface RenderedList {
    title?: string;
    availableListViews: ('list' | 'grid')[];
    items: RenderedListItem[];
    isFiltersAndButtons?: boolean;
}
export default abstract class ViewHandler {
    abstract browse(): Promise<RenderedPage>;
    abstract explode(): Promise<any>;
}
//# sourceMappingURL=ViewHandler.d.ts.map