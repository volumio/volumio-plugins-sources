import View from './View';
import { RenderedPage } from './ViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
import { LiveStreamOrderBy } from '../../../model/LiveStreamModel';
import { LiveStreamEntity } from '../../../entities/LiveStreamEntity';
export interface LiveStreamView extends View {
    name: 'liveStream' | 'liveStreams';
    category?: string;
    orderBy?: LiveStreamOrderBy;
    select?: 'category' | 'orderBy';
    username?: string;
}
export default class LiveStreamViewHandler extends ExplodableViewHandler<LiveStreamView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected getStreamableEntitiesOnExplode(): Promise<never[] | LiveStreamEntity>;
}
//# sourceMappingURL=LiveStreamViewHandler.d.ts.map