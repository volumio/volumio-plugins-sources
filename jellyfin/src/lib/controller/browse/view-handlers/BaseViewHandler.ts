import ServerConnection from '../../../connection/ServerConnection';
import Model, { ModelType } from '../../../model';
import BaseModel, { GetItemsParams } from '../../../model/BaseModel';
import AlbumModel from '../../../model/AlbumModel';
import ArtistModel from '../../../model/ArtistModel';
import CollectionModel from '../../../model/CollectionModel';
import AZFilterModel from '../../../model/filter/AZFilterModel';
import FilterFilterModel from '../../../model/filter/FilterFilterModel';
import GenreFilterModel from '../../../model/filter/GenreFilterModel';
import SortFilterModel from '../../../model/filter/SortFilterModel';
import YearFilterModel from '../../../model/filter/YearFilterModel';
import FolderModel from '../../../model/FolderModel';
import GenreModel from '../../../model/GenreModel';
import PlaylistModel from '../../../model/PlaylistModel';
import SongModel from '../../../model/SongModel';
import UserViewModel from '../../../model/UserViewModel';
import View from './View';
import ViewHandler, { RenderedPage, RenderedPageContents } from './ViewHandler';
import { EntityType } from '../../../entities';
import Renderer from './renderer';
import AlbumRenderer from './renderer/AlbumRenderer';
import ArtistRenderer from './renderer/ArtistRenderer';
import CollectionRenderer from './renderer/CollectionRenderer';
import FolderRenderer from './renderer/FolderRenderer';
import GenreRenderer from './renderer/GenreRenderer';
import PlaylistRenderer from './renderer/PlaylistRenderer';
import ServerRenderer from './renderer/ServerRenderer';
import SongRenderer from './renderer/SongRenderer';
import ViewHelper from './ViewHelper';
import jellyfin from '../../../JellyfinContext';
import BaseRenderer, { RenderedListItem } from './renderer/BaseRenderer';
import BaseEntity from '../../../entities/BaseEntity';
import { ExplodedTrackInfo } from './Explodable';
import { objectAssignIfExists } from '../../../util';
import UserViewRenderer from './renderer/UserViewRenderer';
import AlbumArtHandler from '../../../util/AlbumArtHandler';
import UI from '../../../util/UI';
import { CollectionView } from './CollectionViewHandler';
import { CollectionsView } from './CollectionsViewHandler';
import { LibraryView } from './LibraryViewHandler';
import { FolderView } from './FolderViewHandler';
import { PlaylistView } from './PlaylistViewHandler';

interface PageTitleCrumb {
  uri?: string,
  text: string
}

export default class BaseViewHandler<V extends View> implements ViewHandler {

  #uri: string;
  #currentView: V;
  #previousViews: View[];
  #connection: ServerConnection | null;
  #models: Record<any, BaseModel>;
  #renderers: Record<any, BaseRenderer<BaseEntity> | null>;
  #albumArtHandler: AlbumArtHandler;

  constructor(uri: string, currentView: V, previousViews: View[], connection: ServerConnection | null) {
    this.#uri = uri;
    this.#currentView = currentView;
    this.#previousViews = previousViews;
    this.#connection = connection;
    this.#models = {};
    this.#renderers = {};
    this.#albumArtHandler = new AlbumArtHandler();
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

  getModel(type: ModelType.SortFilter): SortFilterModel;
  getModel(type: ModelType.FilterFilter): FilterFilterModel;
  getModel(type: ModelType.YearFilter): YearFilterModel;
  getModel(type: ModelType.GenreFilter): GenreFilterModel;
  getModel(type: ModelType.AZFilter): AZFilterModel;
  getModel(type: ModelType.Folder): FolderModel;
  getModel(type: ModelType.Collection): CollectionModel;
  getModel(type: ModelType.Song): SongModel;
  getModel(type: ModelType.Genre): GenreModel;
  getModel(type: ModelType.Artist): ArtistModel;
  getModel(type: ModelType.Playlist): PlaylistModel;
  getModel(type: ModelType.Album): AlbumModel;
  getModel(type: ModelType.UserView): UserViewModel;
  getModel(type: any): BaseModel {
    if (!this.#connection) {
      throw Error('No server connection');
    }
    if (!this.#models[type]) {
      this.#models[type] = Model.getInstance(type, this.#connection);
    }
    return this.#models[type];
  }

  getRenderer(type: EntityType.Album): AlbumRenderer;
  getRenderer(type: EntityType.Artist): ArtistRenderer;
  getRenderer(type: EntityType.Collection): CollectionRenderer;
  getRenderer(type: EntityType.Folder): FolderRenderer;
  getRenderer(type: EntityType.Genre): GenreRenderer;
  getRenderer(type: EntityType.Playlist): PlaylistRenderer;
  getRenderer(type: EntityType.Server): ServerRenderer;
  getRenderer(type: EntityType.Song): SongRenderer;
  getRenderer(type: EntityType.UserView): UserViewRenderer;
  getRenderer<E extends BaseEntity>(type: any): BaseRenderer<E> | null {
    if (this.#renderers[type] === undefined) {
      try {
        this.#renderers[type] = Renderer.getInstance(type, this.#uri,
          this.#currentView, this.#previousViews, this.#albumArtHandler);
      }
      catch (error: any) {
        this.#renderers[type] = null;
      }
    }
    return this.#renderers[type];
  }

  constructPrevUri(): string {
    const segments = [];

    this.#previousViews.forEach((view) => {
      segments.push(ViewHelper.constructUriSegmentFromView(view));
    });

    if ((this.#currentView.startIndex || 0) > 0) {
      const delta = this.#currentView.limit || jellyfin.getConfigValue('itemsPerPage');
      const startIndex = Math.max((this.#currentView.startIndex || 0) - delta, 0);
      segments.push(ViewHelper.constructUriSegmentFromView({
        ...this.#currentView,
        startIndex
      }));
    }

    return segments.join('/');
  }

  constructNextUri(startIndex?: number, nextView?: View): string {
    const segments = [];

    this.#previousViews.forEach((view) => {
      segments.push(ViewHelper.constructUriSegmentFromView(view));
    });

    const currentView = nextView || this.#currentView;

    if (startIndex === undefined) {
      startIndex = (currentView.startIndex || 0) + (currentView.limit || jellyfin.getConfigValue('itemsPerPage'));
    }

    segments.push(ViewHelper.constructUriSegmentFromView({
      ...currentView,
      startIndex
    }));

    return segments.join('/');
  }

  constructNextPageItem(nextUri: string, title?: string): RenderedListItem {
    if (!title) {
      title = `<span style='color: #7a848e;'>${jellyfin.getI18n('JELLYFIN_NEXT_PAGE')}</span>`;
    }
    return {
      service: 'jellyfin',
      type: 'streaming-category',
      title: title,
      uri: `${nextUri}@noExplode=1`,
      icon: 'fa fa-arrow-circle-right'
    };
  }

  constructMoreItem(moreUri: string, title?: string): RenderedListItem {
    if (!title) {
      title = `<span style='color: #7a848e;'>${jellyfin.getI18n('JELLYFIN_VIEW_MORE')}</span>`;
    }
    return this.constructNextPageItem(moreUri, title);
  }

  getModelQueryParams(bundle?: Record<string, any>): GetItemsParams {
    const defaults = {
      startIndex: 0,
      limit: jellyfin.getConfigValue('itemsPerPage'),
      sortBy: 'SortName',
      sortOrder: 'Ascending'
    };
    const props = {
      ...defaults,
      ...(bundle || this.currentView)
    } as Record<string, any>;

    const params = objectAssignIfExists({} as GetItemsParams, props, [
      'startIndex',
      'limit', // Negative value for no limit
      'sortBy',
      'sortOrder',
      'recursive',
      'parentId',
      'genreIds', // Comma-delimited
      'filters', // Comma-delimited; e.g. 'IsFavorite, IsPlayed'
      'years', // Comma-delimited
      'nameStartsWith'
    ]);

    if (props.artistId) {
      params.artistIds = props.artistId;
    }

    if (props.albumArtistId) {
      params.albumArtistIds = props.albumArtistId;
    }

    if (props.genreId) {
      if (params.genreIds) {
        params.genreIds += `,${props.genreId}`;
      }
      else {
        params.genreIds = props.genreId;
      }
    }

    if (props.search) {
      // Safe value
      params.search = props.search.replace(/"/g, '\\"');
    }

    return params;
  }

  getAlbumArt<T extends BaseEntity>(item: T): string {
    return this.#albumArtHandler.getAlbumArtUri(item);
  }

  get serverConnection(): ServerConnection | null {
    return this.#connection;
  }

  async setPageTitle(pageContents: RenderedPageContents): Promise<RenderedPageContents> {
    const supportsEnhancedTitles = UI.supportsEnhancedTitles();
    const view = this.#currentView;
    let itemText = '';
    // If first list already has a title, use that. Otherwise, deduce from view.
    if (pageContents.lists?.[0]?.title) {
      itemText = pageContents.lists[0].title;
    }
    else if (view.fixedView) {
      let itemTextKey;
      switch (view.fixedView) {
        case 'latest':
          itemTextKey = `LATEST_${view.name.toUpperCase()}`;
          break;
        case 'recentlyPlayed':
          itemTextKey = `RECENTLY_PLAYED_${view.name.toUpperCase()}`;
          break;
        case 'frequentlyPlayed':
          itemTextKey = `FREQUENTLY_PLAYED_${view.name.toUpperCase()}`;
          break;
        case 'favorite':
          itemTextKey = `FAVORITE_${view.name.toUpperCase()}`;
          break;
        default:
          itemTextKey = null;
      }
      itemText = itemTextKey ? jellyfin.getI18n(`JELLYFIN_${itemTextKey}`) : '';
    }
    else if (view.search && !view.collatedSearchResults) {
      const itemName = jellyfin.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
      itemText = jellyfin.getI18n('JELLYFIN_ITEMS_MATCHING', itemName, view.search);
    }
    else {
      itemText = jellyfin.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
    }

    if (view.search && !supportsEnhancedTitles && this.#connection) {
      itemText = jellyfin.getI18n('JELLYFIN_SEARCH_LIST_TITLE_PLAIN',
        `${this.#connection.username} @ ${this.#connection.server.name}`,
        itemText);
    }

    if (!supportsEnhancedTitles || !this.#connection) {
      if (pageContents.lists?.[0]) {
        pageContents.lists[0].title = itemText;
      }
      return pageContents;
    }

    // Crumb links
    // -- First is always server link
    const crumbs: PageTitleCrumb[] = [ {
      uri: `jellyfin/${this.#connection.id}`,
      text: `${this.#connection.username} @ ${this.#connection.server.name}`
    } ];

    // -- Subsequent links
    const allViews = [
      ...this.previousViews,
      view
    ];
    // For 'Latest Albums in {library}' section under 'My Media'
    if (view.name === 'albums' && view.parentId) {
      allViews.push({
        name: 'library',
        parentId: view.parentId
      });
    }
    const processedViews: string[] = [];
    for (let i = 2; i < allViews.length; i++) {
      const pv = allViews[i];
      if (!processedViews.includes(pv.name)) {
        if (pv.name === 'collections') {
          const collectionsView: CollectionsView = {
            name: 'collections',
            parentId: pv.parentId
          };
          crumbs.push({
            uri: ViewHelper.constructUriSegmentFromView(collectionsView),
            text: jellyfin.getI18n('JELLYFIN_COLLECTIONS')
          });
        }
        else if (pv.name === 'collection' && pv.parentId) {
          const collectionView: CollectionView = {
            name: 'collection',
            parentId: pv.parentId
          };
          const model = this.getModel(ModelType.Collection);
          const collection = await model.getCollection(pv.parentId);
          if (collection) {
            crumbs.push({
              uri: ViewHelper.constructUriSegmentFromView(collectionView),
              text: collection?.name
            });
          }
        }
        else if (pv.name === 'playlists') {
          const playlistView: PlaylistView = {
            name: 'playlists'
          };
          crumbs.push({
            uri: ViewHelper.constructUriSegmentFromView(playlistView),
            text: jellyfin.getI18n('JELLYFIN_PLAYLISTS')
          });
        }
        else if (pv.name === 'library' && pv.parentId) {
          const model = this.getModel(ModelType.UserView);
          const userView = await model.getUserView(pv.parentId);
          if (userView) {
            const libraryView: LibraryView = {
              name: 'library',
              parentId: pv.parentId
            };
            crumbs.push({
              uri: ViewHelper.constructUriSegmentFromView(libraryView),
              text: userView.name
            });
          }
        }
        else if (pv.name === 'folder' && pv.parentId) {
          const folderView: FolderView = {
            name: 'folder',
            parentId: pv.parentId
          };
          const model = this.getModel(ModelType.Folder);
          const folder = await model.getFolder(pv.parentId);
          if (folder) {
            crumbs.push({
              uri: ViewHelper.constructUriSegmentFromView(folderView),
              text: folder.name
            });
          }
        }
        else if (view.search && view.collatedSearchResults) {
          const itemName = jellyfin.getI18n(`JELLYFIN_${view.name.toUpperCase()}`);
          crumbs.push({
            text: itemName
          });
        }
        processedViews.push(pv.name);
      }
    }

    let prevCrumbUri: string;
    const crumbsWithFullUri = crumbs.map<PageTitleCrumb>((link) => {
      const crumb: PageTitleCrumb = {
        text: link.text
      };
      if (link.uri) {
        crumb.uri = prevCrumbUri ? `${prevCrumbUri}/${link.uri}` : link.uri;
        prevCrumbUri = crumb.uri;
      }
      return crumb;
    });

    if ((itemText || crumbsWithFullUri.length > 0) && pageContents.lists?.[0]) {
      const crumbStringParts = crumbsWithFullUri.reduce<string[]>((result, crumb, i) => {
        const style = (i > 0 && i === crumbsWithFullUri.length - 1) ? ' style="font-size: 18px;"' : '';
        result.push(`<span${style}}>${crumb.uri ? UI.createLink({ uri: crumb.uri, text: crumb.text }) : crumb.text}</span>`);
        return result;
      }, []);

      const crumbDivider = '<i class="fa fa-angle-right" style="margin: 0px 10px;"></i>';
      const byLine = (itemText && itemText !== crumbsWithFullUri[crumbsWithFullUri.length - 1].text) ?
        `<div style="margin-top: 25px;">${itemText}</div>` : '';

      pageContents.lists[0].title = `
        <div style="width: 100%;">
          <div style="display: flex; align-items: center; font-size: 14px; border-bottom: 1px dotted; border-color: #666; padding-bottom: 10px;">
            <img src="/albumart?sourceicon=${encodeURIComponent('music_service/jellyfin/dist/assets/images/jellyfin.svg')}" style="width: 18px; height: 18px; margin-right: 8px;">${crumbStringParts.join(crumbDivider)}
          </div>
          ${byLine}
        </div>`;
    }

    return pageContents;
  }
}
