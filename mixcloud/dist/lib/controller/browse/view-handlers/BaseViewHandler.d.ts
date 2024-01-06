import { ModelType } from '../../../model';
import { OptionBundle } from '../../../model/BaseModel';
import CloudcastModel, { GetCloudcastsLoopFetchResult, GetCloudcastsType } from '../../../model/CloudcastModel';
import DiscoverModel from '../../../model/DiscoverModel';
import LiveStreamModel from '../../../model/LiveStreamModel';
import PlaylistModel from '../../../model/PlaylistModel';
import TagModel from '../../../model/TagModel';
import UserModel from '../../../model/UserModel';
import { UILink } from '../../../util/UIHelper';
import { ExplodedTrackInfo } from './ExplodableViewHandler';
import View, { PageRef } from './View';
import ViewHandler, { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import CloudcastRenderer from './renderers/CloudcastRenderer';
import LiveStreamRenderer from './renderers/LiveStreamRenderer';
import PlaylistRenderer from './renderers/PlaylistRenderer';
import SlugRenderer from './renderers/SlugRenderer';
import UserRenderer from './renderers/UserRenderer';
export default class BaseViewHandler<V extends View> implements ViewHandler {
    #private;
    constructor(uri: string, currentView: V, previousViews: View[]);
    browse(): Promise<RenderedPage>;
    explode(): Promise<ExplodedTrackInfo[]>;
    get uri(): string;
    get currentView(): V;
    get previousViews(): View[];
    protected getModel(type: ModelType.Cloudcast): CloudcastModel;
    protected getModel(type: ModelType.Discover): DiscoverModel;
    protected getModel(type: ModelType.Playlist): PlaylistModel;
    protected getModel(type: ModelType.Tag): TagModel;
    protected getModel(type: ModelType.User): UserModel;
    protected getModel(type: ModelType.LiveStream): LiveStreamModel;
    protected getRenderer(type: RendererType.Cloudcast): CloudcastRenderer;
    protected getRenderer(type: RendererType.Playlist): PlaylistRenderer;
    protected getRenderer(type: RendererType.Slug): SlugRenderer;
    protected getRenderer(type: RendererType.User): UserRenderer;
    protected getRenderer(type: RendererType.LiveStream): LiveStreamRenderer;
    protected constructPrevUri(): string;
    protected constructNextUri(nextPageRef: PageRef): string;
    protected constructNextPageItem(nextUri: string, title?: string): RenderedListItem;
    protected constructPrevViewLink(text: string): {
        url: string;
        text: string;
        onclick: string;
        icon: {
            type: "fa" | "mixcloud";
            float?: string | undefined;
            color?: string | undefined;
            class?: string | undefined;
        } | undefined;
    };
    constructPageRef(pageToken?: string | null, pageOffset?: number): PageRef | null;
    protected constructGoToViewLink(text: string, uri: string): UILink;
    protected getCloudcastList<T extends GetCloudcastsType>(cloudcasts: GetCloudcastsLoopFetchResult<T>, showMoreFromUser?: boolean): RenderedList;
    protected browseOptionValues<T extends OptionBundle<any>>(params: {
        getOptionBundle: () => Promise<T>;
        targetOption: string;
    }): Promise<RenderedPage>;
    protected getOptionList<T extends OptionBundle<any>>(params: {
        getOptionBundle: () => Promise<T>;
        currentSelected: {
            [K in keyof T]?: T[K]['values'][number]['value'];
        };
        showOptionName?: (option: keyof T) => boolean;
    }): Promise<RenderedList | null>;
}
//# sourceMappingURL=BaseViewHandler.d.ts.map