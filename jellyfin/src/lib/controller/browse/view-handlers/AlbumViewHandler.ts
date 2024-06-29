import { EntityType, Song } from '../../../entities';
import { ModelType } from '../../../model';
import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import { Explodable } from './Explodable';
import { FilterType } from '../../../model/filter/FilterModel';
import { GetItemsParams } from '../../../model/BaseModel';
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';

export interface AlbumView extends View {
  name: 'albums';
  parentId?: string;
  artistId?: string;
  albumArtistId?: string;
  artistAlbumListType?: 'albums' | 'appearsOn' | 'all';
  search?: string;
  genreId?: string;
  collatedSearchResults?: '1';
}

class AlbumViewHandler extends FilterableViewHandler<AlbumView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const view = this.currentView;

    const { lists, modelQueryParams } = await this.handleFilters();

    if (view.search && view.collatedSearchResults) {
      modelQueryParams.limit = jellyfin.getConfigValue('searchAlbumsResultCount');
      const searchResultsMoreView = {
        ...this.currentView,
        collatedSearchResults: undefined
      };
      lists.push(await this.#getList(modelQueryParams, undefined, searchResultsMoreView, 'more'));
    }
    else if (view.artistId || view.albumArtistId) {
      const listType = view.artistAlbumListType || 'all';
      const showAlbumList = listType === 'all' || listType === 'albums';
      const showAppearsOnList = listType === 'all' || listType === 'appearsOn';
      const albumNextView = { ...this.currentView, artistAlbumListType: 'albums' };
      const appearsOnNextView = { ...this.currentView, artistAlbumListType: 'appearsOn' };
      const sortBy = [ ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName ];
      const sortOrder = SortOrder.Descending;
      let albumList, appearsOnList;
      if (view.artistId) {
        albumList = showAlbumList ? await this.#getList({
          ...modelQueryParams,
          artistIds: undefined,
          albumArtistIds: view.artistId,
          sortBy,
          sortOrder
        }, jellyfin.getI18n('JELLYFIN_ALBUMS'), albumNextView) : null;

        appearsOnList = showAppearsOnList ? await this.#getList({
          ...modelQueryParams,
          artistIds: undefined,
          excludeItemIds: view.artistId,
          contributingArtistIds: view.artistId,
          sortBy,
          sortOrder
        }, jellyfin.getI18n('JELLYFIN_APPEARS_ON'), appearsOnNextView) : null;
      }
      else {
        albumList = showAlbumList ? await this.#getList({
          ...modelQueryParams,
          sortBy,
          sortOrder
        }, jellyfin.getI18n('JELLYFIN_ALBUMS'), albumNextView) : null;

        appearsOnList = showAppearsOnList ? await this.#getList({
          ...modelQueryParams,
          albumArtistIds: undefined,
          excludeItemIds: view.albumArtistId,
          contributingArtistIds: view.albumArtistId,
          sortBy,
          sortOrder
        }, jellyfin.getI18n('JELLYFIN_APPEARS_ON'), appearsOnNextView) : null;
      }
      if (albumList?.items.length) {
        lists.push(albumList);
      }
      if (appearsOnList?.items.length) {
        lists.push(appearsOnList);
      }
    }
    else {
      lists.push(await this.#getList(modelQueryParams));
    }

    let header;
    if (view.artistId || view.albumArtistId) {
      const artistModel = this.getModel(ModelType.Artist);
      let headerData;
      if (view.artistId) {
        headerData = await artistModel.getArtist(view.artistId);
      }
      else if (view.albumArtistId) {
        headerData = await artistModel.getAlbumArtist(view.albumArtistId);
      }
      header = headerData ? this.getRenderer(EntityType.Artist).renderToHeader(headerData) : null;
    }
    else if (view.genreId) {
      const genreModel = this.getModel(ModelType.Genre);
      const headerData = await genreModel.getGenre(view.genreId);
      header = headerData ? this.getRenderer(EntityType.Genre).renderToHeader(headerData) : null;
    }

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      info: header || undefined,
      lists
    };

    if (!header) {
      await this.setPageTitle(pageContents);
    }

    return {
      navigation: pageContents
    };
  }

  async #getList(modelQueryParams: GetItemsParams, title?: string, nextView?: View, nextType: 'nextPage' | 'more' = 'nextPage'): Promise<RenderedList> {
    const model = this.getModel(ModelType.Album);
    const renderer = this.getRenderer(EntityType.Album);
    const albums = await model.getAlbums(modelQueryParams);
    const listItems = albums.items.map((album) =>
      renderer.renderToListItem(album)).filter((item) => item) as RenderedListItem[];

    if (albums.nextStartIndex) {
      if (!nextView) {
        nextView = this.currentView;
      }
      if (nextType === 'more') {
        const moreUri = this.constructNextUri(0, nextView);
        listItems.push(this.constructMoreItem(moreUri));
      }
      else {
        const nextUri = this.constructNextUri(albums.nextStartIndex, nextView);
        listItems.push(this.constructNextPageItem(nextUri));
      }
    }

    return {
      availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
      items: listItems,
      title
    };
  }

  protected getFilterableViewConfig(): FilterableViewConfig {
    const view = this.currentView;
    const showFilters = !view.fixedView && !view.search && !view.artistId && !view.albumArtistId;
    const saveFiltersKey = view.genreId ? 'genreAlbum' : `${view.parentId}.album`;
    const filterTypes = [ FilterType.Sort, FilterType.AZ, FilterType.Filter ];
    if (view.genreId) { // Coming from Genres view
      filterTypes.push(FilterType.Year);
    }
    else {
      filterTypes.push(FilterType.Genre, FilterType.Year);
    }

    return {
      showFilters,
      saveFiltersKey,
      filterTypes
    };
  }

  async getSongsOnExplode(): Promise<Song[]> {
    const trackLimit = jellyfin.getConfigValue('maxTracks');
    const albumModel = this.getModel(ModelType.Album);
    const songModel = this.getModel(ModelType.Song);
    const result: Song[] = [];

    const { modelQueryParams: albumModelQueryParams } = await this.handleFilters();
    albumModelQueryParams.limit = 50; // Fetch 50 albums at a time

    let iterations = 0, albumCount = 0;
    while (iterations < 500) {
      // Get albums
      const albums = await albumModel.getAlbums(albumModelQueryParams);

      // Fetch songs in each album and add to result (break when track limit is reached)
      for (const album of albums.items) {
        const songs = await songModel.getSongs({ parentId: album.id });
        result.push(...songs.items);
        albumCount++;
        if (result.length >= trackLimit) {
          break;
        }
      }

      // Stop iteration if track limit is reached or no more albums available
      if (result.length >= trackLimit || !albums.nextStartIndex) {
        result.splice(trackLimit);
        break;
      }

      albumModelQueryParams.startIndex = albums.nextStartIndex;
      iterations++;
    }

    jellyfin.getLogger().info(`[jellyfin-view-album] getSongsOnExplode(): Fetched ${result.length} songs from ${albumCount} albums.`);

    return result;
  }
}

export default Explodable(AlbumViewHandler);
