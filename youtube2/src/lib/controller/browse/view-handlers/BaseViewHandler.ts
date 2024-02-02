import yt2 from '../../../YouTube2Context';
import Model, { ModelOf, ModelType } from '../../../model';
import { BaseModel } from '../../../model/BaseModel';
import { PageElement } from '../../../types';
import { QueueItem } from './ExplodableViewHandler';
import View, { ContinuationBundle } from './View';
import ViewHandler, { RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import Renderer, { RendererOf, RendererType } from './renderers';
import BaseRenderer, { RenderedListItem } from './renderers/BaseRenderer';

export interface ContinuationData {
  continuation: PageElement.Continuation<any>;
  prevItemCount: number;
  bundle: ContinuationBundle;
}

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

  explode(): Promise<QueueItem[]> {
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

  protected getModel<T extends ModelType>(type: T): ModelOf<T> {
    if (!this.#models[type]) {
      let model;
      switch (type) {
        case ModelType.Account:
          model = Model.getInstance(ModelType.Account);
          break;
        case ModelType.Config:
          model = Model.getInstance(ModelType.Config);
          break;
        case ModelType.Endpoint:
          model = Model.getInstance(ModelType.Endpoint);
          break;
        case ModelType.Playlist:
          model = Model.getInstance(ModelType.Playlist);
          break;
        case ModelType.Search:
          model = Model.getInstance(ModelType.Search);
          break;
        case ModelType.Video:
          model = Model.getInstance(ModelType.Video);
          break;
        case ModelType.Root:
          model = Model.getInstance(ModelType.Root);
          break;
        default:
          throw Error(`Unknown model type: ${type}`);
      }
      this.#models[type] = model;
    }

    return this.#models[type] as ModelOf<T>;
  }

  protected getRenderer<T extends RendererType>(type: T): RendererOf<T> {
    if (!this.#renderers[type]) {
      let renderer: BaseRenderer<any, any>;
      switch (type) {
        case RendererType.Channel:
          renderer = Renderer.getInstance(RendererType.Channel, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.EndpointLink:
          renderer = Renderer.getInstance(RendererType.EndpointLink, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Option:
          renderer = Renderer.getInstance(RendererType.Option, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.OptionValue:
          renderer = Renderer.getInstance(RendererType.OptionValue, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Playlist:
          renderer = Renderer.getInstance(RendererType.Playlist, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Video:
          renderer = Renderer.getInstance(RendererType.Video, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        default:
          throw Error(`Unknown renderer type: ${type}`);
      }
      this.#renderers[type] = renderer;
    }
    return this.#renderers[type] as RendererOf<T>;
  }

  protected constructPrevUri() {
    return ViewHelper.constructPrevUri(this.#currentView, this.#previousViews);
  }

  #constructContinuationUri(data: ContinuationData) {
    const { continuation, prevItemCount, bundle } = data;
    const endpoint = continuation.endpoint;

    const segments = this.#previousViews.map((view) => ViewHelper.constructUriSegmentFromView(view));

    const newView: View = {
      ...this.#currentView,
      continuation: { endpoint, prevItemCount }
    };

    const prevContinuations = this.#currentView.prevContinuations || [];
    if (this.#currentView.continuation) {
      prevContinuations.push(this.#currentView.continuation);
    }
    if (prevContinuations.length > 0) {
      newView.prevContinuations = prevContinuations;
    }
    else {
      delete newView.prevContinuations;
    }

    if (!newView.continuationBundle && bundle) {
      newView.continuationBundle = bundle;
    }

    segments.push(ViewHelper.constructUriSegmentFromView(newView));

    return segments.join('/');
  }

  protected constructContinuationItem(data: ContinuationData): RenderedListItem {
    return {
      service: 'youtube2',
      type: 'item-no-menu',
      'title': data.continuation.text || yt2.getI18n('YOUTUBE2_MORE'),
      'uri': `${this.#constructContinuationUri(data)}@noExplode=1`,
      'icon': 'fa fa-arrow-circle-right'
    };
  }
}
