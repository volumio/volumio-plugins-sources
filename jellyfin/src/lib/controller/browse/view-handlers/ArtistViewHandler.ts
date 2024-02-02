import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import ViewHelper from './ViewHelper';
import { FilterType } from '../../../model/filter/FilterModel';

export interface ArtistView extends View {
  name: 'artists' | 'albumArtists';
  parentId?: string;
  search?: string;
  collatedSearchResults?: '1';
}

export default class ArtistViewHandler extends FilterableViewHandler<ArtistView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const view = this.currentView;
    const artistType = view.name === 'artists' ? EntityType.Artist : EntityType.AlbumArtist;

    const { lists, modelQueryParams } = await this.handleFilters();

    if (view.search && view.collatedSearchResults) {
      modelQueryParams.limit = jellyfin.getConfigValue('searchArtistsResultCount');
    }

    const model = this.getModel(ModelType.Artist);
    const renderer = this.getRenderer(EntityType.Artist);
    const artists = artistType === EntityType.Artist ?
      await model.getArtists(modelQueryParams) : await model.getAlbumArtists(modelQueryParams);
    const listItems = artists.items.map((artist) =>
      renderer.renderToListItem(artist)).filter((item) => item) as RenderedListItem[];

    if (artists.nextStartIndex) {
      if (view.search && view.collatedSearchResults && this.serverConnection) {
        const artistView: ArtistView = {
          name: 'artists',
          search: view.search
        };
        const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper.constructUriSegmentFromView(artistView)}`;
        listItems.push(this.constructMoreItem(moreUri));
      }
      else {
        const nextUri = this.constructNextUri(artists.nextStartIndex);
        listItems.push(this.constructNextPageItem(nextUri));
      }
    }

    lists.push({
      availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
      items: listItems
    });

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists
    };

    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }

  protected getFilterableViewConfig(): FilterableViewConfig {
    const view = this.currentView;
    const artistType = view.name === 'artists' ? EntityType.Artist : EntityType.AlbumArtist;
    const showFilters = !view.fixedView && !view.search;
    const saveFiltersKey = `${view.parentId}.${artistType}`;
    const filterTypes = [ FilterType.AZ, FilterType.Filter, FilterType.Genre ];

    return {
      showFilters,
      saveFiltersKey,
      filterTypes
    };
  }
}
