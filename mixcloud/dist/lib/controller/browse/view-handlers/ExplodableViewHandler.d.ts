import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { CloudcastEntity } from '../../../entities/CloudcastEntity';
import { LiveStreamEntity } from '../../../entities/LiveStreamEntity';
export interface ExplodedTrackInfo {
    service: 'mixcloud';
    uri: string;
    albumart?: string;
    artist?: string;
    album?: string;
    name: string;
    title: string;
    duration?: number;
    samplerate?: string;
}
export type StreamableEntity = CloudcastEntity | LiveStreamEntity;
export default abstract class ExplodableViewHandler<V extends View> extends BaseViewHandler<V> {
    #private;
    explode(): Promise<ExplodedTrackInfo[]>;
    protected convertStreamableEntityToExplodedTrackInfo(entity: StreamableEntity): Promise<ExplodedTrackInfo | null>;
    protected abstract getStreamableEntitiesOnExplode(): Promise<StreamableEntity | StreamableEntity[]>;
}
//# sourceMappingURL=ExplodableViewHandler.d.ts.map