import View from '../View';
export interface RenderedListItem {
    service: 'ytmusic';
    type: 'folder' | 'song' | 'album' | 'item-no-menu';
    tracknumber?: string;
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
    service: 'ytmusic';
    type: 'album' | 'song' | 'playlist';
    uri: string;
    albumart?: string | null;
    title?: string | null;
    album?: string | null;
    artist?: string | null;
    year?: number | string | null;
    duration?: string | null;
    genre?: string | null;
}
export default abstract class BaseRenderer<I, H = I> {
    #private;
    constructor(uri: string, currentView: View, previousViews: View[]);
    abstract renderToListItem(data: I, ...args: any[]): RenderedListItem | null;
    renderToHeader(data: H): RenderedHeader | null;
    get uri(): string;
    get currentView(): View;
    get previousViews(): View[];
}
//# sourceMappingURL=BaseRenderer.d.ts.map