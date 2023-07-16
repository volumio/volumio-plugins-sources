import Endpoint from '../../../types/Endpoint';
import PageContent from '../../../types/PageContent';
import GenericViewHandler, { GenericView } from './GenericViewHandler';
export interface PlaylistView extends Omit<GenericView, 'name'> {
    name: 'playlist';
    endpoints: {
        browse: Endpoint;
        watch: Endpoint;
    };
}
export default class PlaylistViewHandler extends GenericViewHandler<PlaylistView> {
    protected getContents(): Promise<PageContent>;
    protected getEndpoint(explode?: boolean): Endpoint | null;
}
//# sourceMappingURL=PlaylistViewHandler.d.ts.map