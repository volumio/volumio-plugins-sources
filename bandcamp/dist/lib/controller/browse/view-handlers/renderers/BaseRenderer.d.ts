import View from '../View';
export interface RenderedListItem {
    service: 'bandcamp';
    type: 'folder' | 'song' | 'item-no-menu';
    title: string;
    albumart?: string | null;
    artist?: string | null;
    album?: string | null;
    duration?: number | null;
    uri: string;
    icon?: string;
    favorite?: boolean;
}
export interface RenderedHeader {
    service: 'bandcamp';
    type: 'album' | 'song';
    uri: string;
    albumart?: string | null;
    title?: string | null;
    album?: string | null;
    artist?: string | null;
    year?: number | string | null;
    duration?: string | null;
    genre?: string | null;
}
export default abstract class BaseRenderer<T> {
    #private;
    constructor(uri: string, currentView: View, previousViews: View[]);
    abstract renderToListItem(data: T, ...args: any[]): RenderedListItem | null;
    renderToHeader(data: T): RenderedHeader | null;
    get uri(): string;
    get currentView(): View;
    get previousViews(): View[];
    protected addType(type: string, text: string): string;
    protected timeFormat(time: number | null): string | null;
    getStringFromIdNamePair(data: {
        id: string;
        name: string;
    }[]): string;
}
//# sourceMappingURL=BaseRenderer.d.ts.map