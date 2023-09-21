import sc from '../../../SoundCloudContext';
import Model, { ModelOf, ModelType } from '../../../model';
import BaseModel, { LoopFetchResult } from '../../../model/BaseModel';
import { QueueItem } from './ExplodableViewHandler';
import View, { PageRef } from './View';
import ViewHandler, { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import Renderer, { RendererOf, RendererType } from './renderers';
import BaseRenderer, { RenderedListItem } from './renderers/BaseRenderer';

export type BuildPageFromLoopFetchResultParams<E> = ({
  renderer: BaseRenderer<E>,
  getRenderer?: undefined,
  render?: undefined,
} | {
  renderer?: undefined,
  getRenderer: (item: E) => BaseRenderer<E> | null,
  render?: undefined,
} | {
  renderer?: undefined,
  getRenderer?: undefined,
  render: (item: E) => RenderedListItem | null,
}) & {
  title?: string
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
        case ModelType.Album:
          model = Model.getInstance(ModelType.Album);
          break;
        case ModelType.Selection:
          model = Model.getInstance(ModelType.Selection);
          break;
        case ModelType.Track:
          model = Model.getInstance(ModelType.Track);
          break;
        case ModelType.Playlist:
          model = Model.getInstance(ModelType.Playlist);
          break;
        case ModelType.User:
          model = Model.getInstance(ModelType.User);
          break;
        case ModelType.History:
          model = Model.getInstance(ModelType.History);
          break;
        case ModelType.Me:
          model = Model.getInstance(ModelType.Me);
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
        case RendererType.Album:
          renderer = Renderer.getInstance(RendererType.Album, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Playlist:
          renderer = Renderer.getInstance(RendererType.Playlist, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.Track:
          renderer = Renderer.getInstance(RendererType.Track, this.#uri,
            this.#currentView, this.#previousViews);
          break;
        case RendererType.User:
          renderer = Renderer.getInstance(RendererType.User, this.#uri,
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

  #constructNextUri(nextPageRef: PageRef) {
    const segments = this.#previousViews.map((view) => ViewHelper.constructUriSegmentFromView(view));

    const newView: View = {
      ...this.#currentView,
      pageRef: nextPageRef,
      noExplode: '1'
    };

    const prevPageRefs = this.#currentView.prevPageRefs || [];
    if (this.#currentView.pageRef) {
      prevPageRefs.push(this.#currentView.pageRef);
    }
    if (prevPageRefs.length > 0) {
      newView.prevPageRefs = prevPageRefs;
    }
    else {
      delete newView.prevPageRefs;
    }

    segments.push(`${ViewHelper.constructUriSegmentFromView(newView, [ 'noExplode' ])}`);

    return segments.join('/');
  }

  protected constructNextPageItem(data: PageRef | string): RenderedListItem {
    return {
      service: 'soundcloud',
      type: 'item-no-menu',
      'title': sc.getI18n('SOUNDCLOUD_MORE'),
      'uri': typeof data === 'string' ? data : this.#constructNextUri(data),
      'icon': 'fa fa-arrow-circle-right'
    };
  }

  protected constructPageRef(pageToken?: string | null, pageOffset?: number): PageRef | null {
    if (!pageToken && !pageOffset) {
      return null;
    }
    return {
      pageToken: pageToken || '',
      pageOffset: pageOffset || 0
    };
  }

  protected addLinkToListTitle(title = '', link: string, linkText: string) {
    if (!ViewHelper.supportsEnhancedTitles()) {
      return title;
    }
    return `<div style="display: flex; width: 100%; align-items: baseline;">
            <div>${title}</div>
            <div style="flex-grow: 1; text-align: right; font-size: small;">
            <i class="fa fa-soundcloud" style="position: relative; top: 1px; margin-right: 2px; font-size: 16px;"></i>
            <a target="_blank" style="color: #50b37d;" href="${link}">
                ${linkText}
            </a>
            </div>
        </div>
    `;
  }

  protected buildPageFromLoopFetchResult<E>(result: LoopFetchResult<E>, params: BuildPageFromLoopFetchResultParams<E>): RenderedPage {
    const { title = '' } = params;
    const listItems = result.items.reduce<RenderedListItem[]>((result, item) => {
      let rendered: RenderedListItem | null = null;
      if (params.getRenderer) {
        const renderer = params.getRenderer(item);
        rendered = renderer?.renderToListItem(item) || null;
      }
      else if (params.render) {
        rendered = params.render(item);
      }
      else if (params.renderer) {
        rendered = params.renderer.renderToListItem(item);
      }
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(result.nextPageToken, result.nextPageOffset);
    if (nextPageRef) {
      listItems.push(this.constructNextPageItem(nextPageRef));
    }

    const list: RenderedList = {
      title: this.currentView.title || title,
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [ list ]
      }
    };
  }
}
