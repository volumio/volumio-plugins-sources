import { EntityType, Song } from '../../../entities';
import { ModelType } from '../../../model';
import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import { Explodable } from './Explodable';
import ViewHelper from './ViewHelper';
import { FilterType } from '../../../model/filter/FilterModel';

export interface AlbumView extends View {
  name: 'albums';
  parentId?: string;
  artistId?: string;
  albumArtistId?: string;
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
      modelQueryParams.limit = jellyfin.getConfigValue('searchAlbumsResultCount', 11);
    }

    const model = this.getModel(ModelType.Album);
    const renderer = this.getRenderer(EntityType.Album);
    const albums = await model.getAlbums(modelQueryParams);
    const listItems = albums.items.map((album) =>
      renderer.renderToListItem(album)).filter((item) => item) as RenderedListItem[];

    if (albums.nextStartIndex) {
      if (view.search && view.collatedSearchResults && this.serverConnection) {
        const albumView: AlbumView = {
          name: 'albums',
          search: view.search
        };
        const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper.constructUriSegmentFromView(albumView)}`;
        listItems.push(this.constructMoreItem(moreUri));
      }
      else {
        const nextUri = this.constructNextUri(albums.nextStartIndex);
        listItems.push(this.constructNextPageItem(nextUri));
      }
    }

    lists.push({
      availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
      items: listItems
    });

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
    const trackLimit = jellyfin.getConfigValue('maxTracks', 100);
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
