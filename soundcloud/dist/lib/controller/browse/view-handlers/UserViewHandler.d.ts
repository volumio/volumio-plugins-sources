import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface UserView extends View {
    name: 'users';
    userId?: string;
    search?: string;
    myFollowing?: '1';
    combinedSearch?: '1';
    title?: string;
}
export default class UserViewHandler extends ExplodableViewHandler<UserView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected browseUser(userId: number): Promise<RenderedPage>;
    protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=UserViewHandler.d.ts.map