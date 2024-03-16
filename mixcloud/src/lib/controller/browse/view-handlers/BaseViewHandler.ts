import Model, { ModelType } from '../../../model';
import BaseModel, { OptionBundle } from '../../../model/BaseModel';
import CloudcastModel, { GetCloudcastsLoopFetchResult, GetCloudcastsType } from '../../../model/CloudcastModel';
import DiscoverModel from '../../../model/DiscoverModel';
import LiveStreamModel from '../../../model/LiveStreamModel';
import PlaylistModel from '../../../model/PlaylistModel';
import TagModel from '../../../model/TagModel';
import UserModel from '../../../model/UserModel';
import UIHelper, { UILink, UI_STYLES } from '../../../util/UIHelper';
import { ExplodedTrackInfo } from './ExplodableViewHandler';
import View, { PageRef } from './View';
import ViewHandler, { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import Renderer, { RendererType } from './renderers';
import BaseRenderer, { RenderedListItem } from './renderers/BaseRenderer';
import CloudcastRenderer from './renderers/CloudcastRenderer';
import LiveStreamRenderer from './renderers/LiveStreamRenderer';
import PlaylistRenderer from './renderers/PlaylistRenderer';
import SlugRenderer from './renderers/SlugRenderer';
import UserRenderer from './renderers/UserRenderer';

export default class BaseViewHandler<V extends View> implements ViewHandler {

  #uri: string;
  #currentView: V;
  #previousViews: View[];
  #models: Partial<Record<ModelType, BaseModel>>;
  #renderers: Partial<Record<RendererType, BaseRenderer<any>>>;

  constructor(uri: string, currentView: V, previousViews: View[]) {
    this.#uri = uri;
    this.#currentView = currentView;
    this.#previousViews = previousViews;
    this.#models = {};
    this.#renderers = {};
  }

  async browse(): Promise<RenderedPage> {
    return {};
  }

  explode(): Promise<ExplodedTrackInfo[]> {
    throw Error('Operation not supported');
  }

  get uri(): string {
    return this.#uri;
  }

  get currentView(): V {
    return this.#currentView;
  }

  get previousViews(): View[] {
    return this.#previousViews;
  }

  protected getModel(type: ModelType.Cloudcast): CloudcastModel;
  protected getModel(type: ModelType.Discover): DiscoverModel;
  protected getModel(type: ModelType.Playlist): PlaylistModel;
  protected getModel(type: ModelType.Tag): TagModel;
  protected getModel(type: ModelType.User): UserModel;
  protected getModel(type: ModelType.LiveStream): LiveStreamModel;
  protected getModel(type: ModelType) {
    if (!this.#models[type]) {
      let model;
      switch (type) {
        case ModelType.Cloudcast:
          model = Model.getInstance(ModelType.Cloudcast);
          break;
        case ModelType.Discover:
          model = Model.getInstance(ModelType.Discover);
          break;
        case ModelType.Playlist:
          model = Model.getInstance(ModelType.Playlist);
          break;
        case ModelType.Tag:
          model = Model.getInstance(ModelType.Tag);
          break;
        case ModelType.User:
          model = Model.getInstance(ModelType.User);
          break;
        case ModelType.LiveStream:
          model = Model.getInstance(ModelType.LiveStream);
          break;
        default:
          throw Error(`Unknown model type: ${type}`);
      }
      this.#models[type] = model;
    }

    return this.#models[type];
  }

  protected getRenderer(type: RendererType.Cloudcast): CloudcastRenderer;
  protected getRenderer(type: RendererType.Playlist): PlaylistRenderer;
  protected getRenderer(type: RendererType.Slug): SlugRenderer;
  protected getRenderer(type: RendererType.User): UserRenderer;
  protected getRenderer(type: RendererType.LiveStream): LiveStreamRenderer;
  protected getRenderer(type: RendererType) {
    if (!this.#renderers[type]) {
      let renderer;
      switch (type) {
        case RendererType.Cloudcast:
          renderer = Renderer.getInstance(RendererType.Cloudcast, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Playlist:
          renderer = Renderer.getInstance(RendererType.Playlist, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Slug:
          renderer = Renderer.getInstance(RendererType.Slug, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.User:
          renderer = Renderer.getInstance(RendererType.User, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.LiveStream:
          renderer = Renderer.getInstance(RendererType.LiveStream, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        default:
          throw Error(`Unknown renderer type: ${type}`);
      }
      this.#renderers[type] = renderer;
    }
    return this.#renderers[type];
  }

  protected constructPrevUri(): string {
    const segments = this.#previousViews.map(((view) => ViewHelper.constructUriSegmentFromView(view)));

    const currentView = this.#currentView;
    if (currentView.pageRef) {
      const newView = { ...currentView };
      delete newView.pageRef;
      delete newView.prevPageRefs;

      if (currentView.prevPageRefs) {
        const prevPageRefs = [ ...currentView.prevPageRefs ];
        const prevPageRef = prevPageRefs.pop();
        if (prevPageRef && prevPageRefs.length > 0) {
          newView.prevPageRefs = prevPageRefs;
        }
        if (prevPageRef) {
          newView.pageRef = prevPageRef;
        }
      }

      segments.push(ViewHelper.constructUriSegmentFromView(newView));
    }

    return segments.join('/');
  }

  protected constructNextUri(nextPageRef: PageRef): string {
    const segments = this.#previousViews.map(((view) => ViewHelper.constructUriSegmentFromView(view)));

    const newView = { ...this.#currentView };
    if (this.#currentView.prevPageRefs) {
      newView.prevPageRefs = [ ...this.#currentView.prevPageRefs ];
    }
    else {
      newView.prevPageRefs = [];
    }
    if (newView.pageRef) {
      newView.prevPageRefs.push(newView.pageRef);
    }
    newView.pageRef = nextPageRef;

    segments.push(ViewHelper.constructUriSegmentFromView(newView));

    return segments.join('/');
  }

  protected constructNextPageItem(nextUri: string, title?: string): RenderedListItem {
    if (!title) {
      title = UIHelper.getMoreText();
    }
    return {
      service: 'mixcloud',
      type: 'item-no-menu',
      title,
      uri: `${nextUri}@noExplode=1`,
      icon: 'fa fa-arrow-circle-right'
    };
  }

  protected constructPrevViewLink(text: string) {
    const backUri = ViewHelper.constructUriFromViews(this.previousViews);
    const icon: UILink['icon'] = {
      type: 'fa',
      class: 'fa fa-arrow-circle-left',
      color: '#54c688'
    };
    return UIHelper.constructBrowsePageLink(
      text,
      backUri,
      icon
    );
  }

  constructPageRef(pageToken?: string | null, pageOffset?: number): PageRef | null {
    if (!pageToken && !pageOffset) {
      return null;
    }
    return {
      pageToken: pageToken || '',
      pageOffset: pageOffset || 0
    };
  }

  protected constructGoToViewLink(text: string, uri: string): UILink {
    const icon: UILink['icon'] = {
      type: 'fa',
      class: 'fa fa-arrow-circle-right',
      float: 'right',
      color: '#54c688'
    };
    return UIHelper.constructBrowsePageLink(
      text,
      uri,
      icon
    );
  }

  protected getCloudcastList<T extends GetCloudcastsType>(cloudcasts: GetCloudcastsLoopFetchResult<T>, showMoreFromUser = false): RenderedList {
    const renderer = this.getRenderer(RendererType.Cloudcast);
    const items = cloudcasts.items.reduce<RenderedListItem[]>((result, cloudcast) => {
      const rendered = renderer.renderToListItem(cloudcast, 'folder', showMoreFromUser);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(cloudcasts.nextPageToken, cloudcasts.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      items.push(this.constructNextPageItem(nextUri));
    }
    return {
      availableListViews: [ 'list', 'grid' ],
      items
    };
  }

  protected async browseOptionValues<T extends OptionBundle<any>>(params: {
    getOptionBundle: () => Promise<T>,
    targetOption: string
  }): Promise<RenderedPage> {

    const option = params.targetOption;
    const bundle = await params.getOptionBundle();
    const optBundleEntry = bundle[option];

    if (!optBundleEntry) {
      throw Error(`Option ${option} not found!`);
    }

    const currentValue = this.currentView[option];
    const items = optBundleEntry.values.reduce<RenderedListItem[]>((result, opt) => {
      const isSelected = opt.value === currentValue;
      const title = isSelected ? UIHelper.styleText(opt.name, UI_STYLES.LIST_ITEM_SELECTED) : opt.name;
      result.push({
        service: 'mixcloud',
        type: 'item-no-menu',
        title,
        icon: isSelected ? 'fa fa-check' : 'fa',
        uri: this.#constructSelectOptionValueUri(option, opt.value)
      });
      return result;
    }, []);

    let listTitle = optBundleEntry.name;
    listTitle = UIHelper.addIconToListTitle(optBundleEntry.icon, listTitle);
    const lists: RenderedList[] = [ {
      title: listTitle,
      availableListViews: [ 'list' ],
      items
    } ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #constructSelectOptionValueUri(option: keyof V, value: any) {
    const newView = { ...this.currentView };
    if (newView[option] !== value) {
      delete newView.pageRef;
      delete newView.prevPageRefs;
      newView[option] = value;
    }
    delete newView.select;

    return ViewHelper.constructUriFromViews([ ...this.previousViews, newView ]);
  }

  protected async getOptionList<T extends OptionBundle<any>>(params: {
    getOptionBundle: () => Promise<T>,
    currentSelected: { [K in keyof T]?: T[K]['values'][number]['value'] },
    showOptionName?: (option: keyof T) => boolean
  }): Promise<RenderedList | null> {

    const baseUri = ViewHelper.constructUriFromViews([
      ...this.previousViews,
      { ...this.currentView, ...params.currentSelected }
    ]);
    const items: RenderedListItem[] = [];

    const bundle = await params.getOptionBundle();
    for (const optKey of Object.keys(bundle)) {
      const currentValue = params.currentSelected[optKey as keyof T];
      if (currentValue !== undefined) {
        const optBundleEntry = bundle[optKey as keyof T];
        const currentOptFromBundle = optBundleEntry.values.find((opt) => opt.value === currentValue);
        if (currentOptFromBundle) {
          let title = currentOptFromBundle.name;
          if (params.showOptionName && params.showOptionName(optKey as keyof T)) {
            title = UIHelper.addTextBefore(title, `${optBundleEntry.name}: `, UI_STYLES.PARAMS_LIST_ITEM_NAME);
          }
          items.push({
            service: 'mixcloud',
            type: 'item-no-menu',
            title,
            icon: optBundleEntry.icon,
            uri: `${baseUri}@select=${optKey}`
          });
        }
      }
    }

    if (items.length > 0) {
      return {
        availableListViews: [ 'list' ],
        items
      };
    }

    return null;
  }

}
