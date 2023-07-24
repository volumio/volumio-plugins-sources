import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import { FilterType } from '../../../model/filter/FilterModel';
import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedPage, RenderedPageContents } from './ViewHandler';

export interface FolderView extends View {
  name: 'folder';
  parentId: string;
}

export default class FolderViewHandler extends FilterableViewHandler<FolderView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const view = this.currentView;

    const { lists, modelQueryParams } = await this.handleFilters();

    const model = this.getModel(ModelType.Folder);
    const folder = await model.getFolder(view.parentId);
    const folderContents = await model.getFolderContents(modelQueryParams);
    const listItems = folderContents.items.map((item) => {
      switch (item.type) {
        case EntityType.Folder:
        case EntityType.CollectionFolder:
          return this.getRenderer(EntityType.Folder).renderToListItem(item);
        case EntityType.Artist:
        case EntityType.AlbumArtist:
          return this.getRenderer(EntityType.Artist).renderToListItem(item);
        case EntityType.Album:
          return this.getRenderer(EntityType.Album).renderToListItem(item);
        default:
          return null;
      }
    }).filter((item) => item) as RenderedListItem[];

    if (folderContents.nextStartIndex) {
      const nextUri = this.constructNextUri(folderContents.nextStartIndex);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    lists.push({
      availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
      items: listItems
    });
    lists[0].title = folder?.name;

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
    return {
      showFilters: true,
      saveFiltersKey: 'folder',
      filterTypes: [ FilterType.Sort, FilterType.AZ ]
    };
  }
}
