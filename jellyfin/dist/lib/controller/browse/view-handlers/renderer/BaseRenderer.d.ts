import BaseEntity from '../../../../entities/BaseEntity';
import AlbumArtHandler from '../../../../util/AlbumArtHandler';
import View from '../View';
export interface RenderedListItem {
    service: 'jellyfin';
    type: 'folder' | 'song' | 'streaming-category' | 'jellyfin-filter' | 'jellyfin-filter-option';
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
    service: 'jellyfin';
    type: 'album' | 'song';
    uri: string;
    albumart: string | null;
    album?: string | null;
    artist?: string | null;
    year?: number | string | null;
    duration?: string | null;
    genre?: string | null;
}
export default abstract class BaseRenderer<T extends BaseEntity> {
    #private;
    constructor(uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler);
    abstract renderToListItem(data: T, ...args: any[]): RenderedListItem | null;
    renderToHeader(data: T): RenderedHeader | null;
    protected getAlbumArt(data: T): string;
    get uri(): string;
    get currentView(): View;
    get previousViews(): View[];
    protected timeFormat(time: number | null): string | null;
    getStringFromIdNamePair(data: {
        id: string;
        name: string;
    }[]): string;
}
//# sourceMappingURL=BaseRenderer.d.ts.map