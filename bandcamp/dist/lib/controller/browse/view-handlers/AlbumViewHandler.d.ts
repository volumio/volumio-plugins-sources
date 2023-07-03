import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface AlbumView extends View {
    name: 'album';
    albumUrl: string;
    track?: string;
    artistUrl?: string;
}
export default class AlbumViewHandler extends ExplodableViewHandler<AlbumView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected browseAlbum(albumUrl: string): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<import("../../../entities/TrackEntity").default | import("../../../entities/TrackEntity").default[]>;
}
//# sourceMappingURL=AlbumViewHandler.d.ts.map