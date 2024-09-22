import { RenderedHeader, RenderedListItem } from './renderer/BaseRenderer';
export interface RenderedPage {
    navigation?: RenderedPageContents;
}
export interface RenderedPageContents {
    prev?: {
        uri?: string;
    };
    info?: RenderedHeader;
    lists?: RenderedList[];
}
export interface RenderedList {
    title?: string;
    availableListViews: ('list' | 'grid')[];
    items: RenderedListItem[];
}
export default abstract class ViewHandler {
    abstract browse(): Promise<RenderedPage>;
    abstract explode(): Promise<any>;
}
//# sourceMappingURL=ViewHandler.d.ts.map