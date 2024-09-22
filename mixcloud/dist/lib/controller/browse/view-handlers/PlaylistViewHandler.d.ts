import View from './View';
import { RenderedPage } from './ViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
export interface PlaylistView extends View {
    name: 'playlist' | 'playlists';
    username?: string;
    playlistId?: string;
}
export default class PlaylistViewHandler extends ExplodableViewHandler<PlaylistView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected getStreamableEntitiesOnExplode(): Promise<import("../../../entities/CloudcastEntity").CloudcastEntity[]>;
}
//# sourceMappingURL=PlaylistViewHandler.d.ts.map