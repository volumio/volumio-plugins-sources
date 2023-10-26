import sc from '../../../SoundCloudContext';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface SelectionView extends View {
  name: 'selections';
  selectionId?: string;
}

export default class SelectionViewHandler extends BaseViewHandler<SelectionView> {

  async browse(): Promise<RenderedPage> {
    const { selectionId, pageRef } = this.currentView;
    const selections = await this.getModel(ModelType.Selection).getSelections({
      mixed: true
    });
    const selection = selections.items.find((s) => s.id === selectionId);
    if (!selection) {
      throw Error('Failed to fetch selection');
    }
    const renderer = this.getRenderer(RendererType.Playlist);
    const offset = Number(pageRef?.pageToken) || 0;
    const limit = sc.getConfigValue('itemsPerPage');
    const nextOffset = offset + limit;
    const slice = selection?.items.slice(offset, nextOffset) || [];
    const listItems = slice.reduce<RenderedListItem[]>((result, item) => {
      const rendered = renderer.renderToListItem(item);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    if (nextOffset < selection.items.length) {
      const nextPageRef = this.constructPageRef(nextOffset.toString(), 0);
      if (nextPageRef) {
        listItems.push(this.constructNextPageItem(nextPageRef));
      }
    }
    const list: RenderedList = {
      title: selection?.title || '',
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };

    return {
      navigation: {
        prev: { uri: '/' },
        lists: [ list ]
      }
    };
  }
}
