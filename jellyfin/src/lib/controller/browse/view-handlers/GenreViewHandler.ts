import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';

export interface GenreView extends View {
  name: 'genres';
  parentId: string;
}

export default class GenreViewHandler extends BaseViewHandler<GenreView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const lists: RenderedList[] = [];
    const modelQueryParams = this.getModelQueryParams();

    const model = this.getModel(ModelType.Genre);
    const renderer = this.getRenderer(EntityType.Genre);
    const genres = await model.getGenres(modelQueryParams);
    const listItems = genres.items.map((genre) =>
      renderer.renderToListItem(genre)).filter((item) => item) as RenderedListItem[];

    if (genres.nextStartIndex) {
      const nextUri = this.constructNextUri(genres.nextStartIndex);
      listItems.push(this.constructNextPageItem(nextUri));
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
}
