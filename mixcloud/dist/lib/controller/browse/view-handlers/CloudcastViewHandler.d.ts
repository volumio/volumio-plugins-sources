import { CloudcastModelGetCloudcastsParams } from '../../../model/CloudcastModel';
import ExplodableViewHandler from './ExplodableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface CloudcastView extends View {
    name: 'cloudcast' | 'cloudcasts';
    cloudcastId?: string;
    showMoreFromUser?: '1';
    username?: string;
    orderBy?: CloudcastModelGetCloudcastsParams['orderBy'];
    playlistId?: string;
    keywords?: string;
    dateUploaded?: CloudcastModelGetCloudcastsParams['dateUploaded'];
    select?: 'dateUploaded' | 'orderBy';
    owner?: string;
}
export default class CloudcastViewHandler extends ExplodableViewHandler<CloudcastView> {
    #private;
    browse(): Promise<RenderedPage>;
    protected getStreamableEntitiesOnExplode(): Promise<import("../../../entities/CloudcastEntity").CloudcastEntity | import("../../../entities/CloudcastEntity").CloudcastEntity[]>;
}
//# sourceMappingURL=CloudcastViewHandler.d.ts.map