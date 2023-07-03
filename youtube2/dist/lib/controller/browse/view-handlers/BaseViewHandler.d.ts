import { ModelType } from '../../../model';
import AccountModel from '../../../model/AccountModel';
import ConfigModel from '../../../model/ConfigModel';
import EndpointModel from '../../../model/EndpointModel';
import PlaylistModel from '../../../model/PlaylistModel';
import RootModel from '../../../model/RootModel';
import SearchModel from '../../../model/SearchModel';
import VideoModel from '../../../model/VideoModel';
import { PageElement } from '../../../types';
import { QueueItem } from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import ViewHandler, { RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import ChannelRenderer from './renderers/ChannelRenderer';
import EndpointLinkRenderer from './renderers/EndpointLinkRenderer';
import OptionRenderer from './renderers/OptionRenderer';
import OptionValueRenderer from './renderers/OptionValueRenderer';
import PlaylistRenderer from './renderers/PlaylistRenderer';
import VideoRenderer from './renderers/VideoRenderer';
export interface ContinuationData {
    continuation: PageElement.Continuation<any>;
    prevItemCount: number;
    bundle: ContinuationBundle;
}
export default class BaseViewHandler<V extends View> implements ViewHandler {
    #private;
    constructor(uri: string, currentView: V, previousViews: View[]);
    browse(): Promise<RenderedPage>;
    explode(): Promise<QueueItem[]>;
    get uri(): string;
    get currentView(): V;
    get previousViews(): View[];
    protected getModel(type: ModelType.Account): AccountModel;
    protected getModel(type: ModelType.Config): ConfigModel;
    protected getModel(type: ModelType.Endpoint): EndpointModel;
    protected getModel(type: ModelType.Playlist): PlaylistModel;
    protected getModel(type: ModelType.Search): SearchModel;
    protected getModel(type: ModelType.Video): VideoModel;
    protected getModel(type: ModelType.Root): RootModel;
    protected getRenderer(type: RendererType.Channel): ChannelRenderer;
    protected getRenderer(type: RendererType.EndpointLink): EndpointLinkRenderer;
    protected getRenderer(type: RendererType.Option): OptionRenderer;
    protected getRenderer(type: RendererType.OptionValue): OptionValueRenderer;
    protected getRenderer(type: RendererType.Playlist): PlaylistRenderer;
    protected getRenderer(type: RendererType.Video): VideoRenderer;
    protected constructPrevUri(): string;
    protected constructContinuationItem(data: ContinuationData): RenderedListItem;
}
//# sourceMappingURL=BaseViewHandler.d.ts.map