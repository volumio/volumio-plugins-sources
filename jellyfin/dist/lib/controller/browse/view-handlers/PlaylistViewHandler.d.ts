import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface PlaylistView extends View {
    name: 'playlists';
}
export default class PlaylistViewHandler extends BaseViewHandler<PlaylistView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=PlaylistViewHandler.d.ts.map