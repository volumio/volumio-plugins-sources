import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedPage, RenderedPageContents } from './ViewHandler';

export interface CollectionsView extends View {
  name: 'collections';
}

export default class CollectionsViewHandler extends BaseViewHandler<CollectionsView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const model = this.getModel(ModelType.Collection);
    const renderer = this.getRenderer(EntityType.Collection);
    const modelQueryParams = this.getModelQueryParams();

    const collections = await model.getCollections(modelQueryParams);
    const listItems = collections.items.map((collection) =>
      renderer.renderToListItem(collection)).filter((item) => item) as RenderedListItem[];

    if (collections.nextStartIndex) {
      const nextUri = this.constructNextUri(collections.nextStartIndex);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists: [
        {
          availableListViews: listItems.length > 0 ? [ 'list', 'grid' ] : [ 'list' ],
          items: listItems
        }
      ]
    };

    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }
}
