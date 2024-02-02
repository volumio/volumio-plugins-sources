import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import BaseRenderer from './renderers/BaseRenderer';
import SetEntity from '../../../entities/SetEntity';
import { LoopFetchResult } from '../../../model/BaseModel';
import { TrackOrigin } from './TrackViewHandler';
export interface SetView extends View {
    search?: string;
    userId?: string;
    title?: string;
    combinedSearch?: '1';
}
export interface SetViewHandlerGetSetsParams {
    userId?: number;
    search?: string;
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
}
export default abstract class SetViewHandler<T extends SetView, ID extends string | number, E extends SetEntity> extends ExplodableViewHandler<T> {
    protected abstract getSetIdFromView(): ID | null | undefined;
    protected abstract getSet(id: ID): Promise<{
        set: E;
        tracksOffset?: number;
        tracksLimit?: number;
    }>;
    protected abstract getSets(modelParams: SetViewHandlerGetSetsParams): Promise<LoopFetchResult<E>>;
    protected abstract getSetsListTitle(): string;
    protected abstract getSetRenderer(): BaseRenderer<E>;
    protected abstract getVisitLinkTitle(): string;
    protected abstract getTrackOrigin(set: E): TrackOrigin | null;
    browse(): Promise<RenderedPage>;
    protected browseSearch(query: string): Promise<RenderedPage>;
    protected browseByUser(userId: number): Promise<RenderedPage>;
    protected browseSet(id: ID): Promise<RenderedPage>;
    protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]>;
}
//# sourceMappingURL=SetViewHandler.d.ts.map