import Model, { ModelType } from '../../../model';
import type AlbumModel from '../../../model/AlbumModel';
import type ArticleModel from '../../../model/ArticleModel';
import type BandModel from '../../../model/BandModel';
import type BaseModel from '../../../model/BaseModel';
import type DiscoverModel from '../../../model/DiscoverModel';
import type FanModel from '../../../model/FanModel';
import type SearchModel from '../../../model/SearchModel';
import type ShowModel from '../../../model/ShowModel';
import type TagModel from '../../../model/TagModel';
import type TrackModel from '../../../model/TrackModel';
import UIHelper from '../../../util/UIHelper';
import { type ExplodedTrackInfo } from './ExplodableViewHandler';
import {type PageRef} from './View';
import type View from './View';
import {type RenderedPage} from './ViewHandler';
import type ViewHandler from './ViewHandler';
import ViewHelper from './ViewHelper';
import Renderer, { RendererType } from './renderers';
import type AlbumRenderer from './renderers/AlbumRenderer';
import type ArticleRenderer from './renderers/ArticleRenderer';
import type BandRenderer from './renderers/BandRenderer';
import {type RenderedListItem} from './renderers/BaseRenderer';
import type BaseRenderer from './renderers/BaseRenderer';
import type SearchResultRenderer from './renderers/SearchResultParser';
import type ShowRenderer from './renderers/ShowRenderer';
import type TagRenderer from './renderers/TagRenderer';
import type TrackRenderer from './renderers/TrackRenderer';

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

  browse(): Promise<RenderedPage> {
    return Promise.resolve({});
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

  getModel(type: ModelType.Album): AlbumModel;
  getModel(type: ModelType.Article): ArticleModel;
  getModel(type: ModelType.Band): BandModel;
  getModel(type: ModelType.Discover): DiscoverModel;
  getModel(type: ModelType.Fan): FanModel;
  getModel(type: ModelType.Search): SearchModel;
  getModel(type: ModelType.Show): ShowModel;
  getModel(type: ModelType.Tag): TagModel;
  getModel(type: ModelType.Track): TrackModel;
  getModel(type: ModelType) {
    if (!this.#models[type]) {
      let model;
      switch (type) {
        case ModelType.Album:
          model = Model.getInstance(ModelType.Album);
          break;
        case ModelType.Article:
          model = Model.getInstance(ModelType.Article);
          break;
        case ModelType.Band:
          model = Model.getInstance(ModelType.Band);
          break;
        case ModelType.Discover:
          model = Model.getInstance(ModelType.Discover);
          break;
        case ModelType.Fan:
          model = Model.getInstance(ModelType.Fan);
          break;
        case ModelType.Search:
          model = Model.getInstance(ModelType.Search);
          break;
        case ModelType.Show:
          model = Model.getInstance(ModelType.Show);
          break;
        case ModelType.Tag:
          model = Model.getInstance(ModelType.Tag);
          break;
        case ModelType.Track:
          model = Model.getInstance(ModelType.Track);
          break;
        default:
          throw Error(`Unknown model type: ${String(type)}`);
      }
      this.#models[type] = model;
    }

    return this.#models[type];
  }

  getRenderer(type: RendererType.Album): AlbumRenderer;
  getRenderer(type: RendererType.Band): BandRenderer;
  getRenderer(type: RendererType.Article): ArticleRenderer;
  getRenderer(type: RendererType.SearchResult): SearchResultRenderer;
  getRenderer(type: RendererType.Show): ShowRenderer;
  getRenderer(type: RendererType.Tag): TagRenderer;
  getRenderer(type: RendererType.Track): TrackRenderer;
  getRenderer(type: RendererType) {
    if (!this.#renderers[type]) {
      let renderer;
      switch (type) {
        case RendererType.Album:
          renderer = Renderer.getInstance(RendererType.Album, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Band:
          renderer = Renderer.getInstance(RendererType.Band, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Article:
          renderer = Renderer.getInstance(RendererType.Article, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.SearchResult:
          renderer = Renderer.getInstance(RendererType.SearchResult, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Show:
          renderer = Renderer.getInstance(RendererType.Show, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Tag:
          renderer = Renderer.getInstance(RendererType.Tag, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Track:
          renderer = Renderer.getInstance(RendererType.Track, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        default:
          throw Error(`Unknown renderer type: ${String(type)}`);
      }
      this.#renderers[type] = renderer;
    }
    return this.#renderers[type];
  }

  constructPrevUri(): string {
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

  constructNextUri(nextPageRef: PageRef): string {
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

  constructNextPageItem(nextUri: string, title?: string): RenderedListItem {
    if (!title) {
      title = UIHelper.getMoreText();
    }
    return {
      service: 'bandcamp',
      type: 'item-no-menu',
      title,
      uri: `${nextUri}@noExplode=1`,
      icon: 'fa fa-arrow-circle-right'
    };
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
}
