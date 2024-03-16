import mixcloud from '../../../MixcloudContext';
import { ModelType } from '../../../model';
import UIHelper, { UI_STYLES } from '../../../util/UIHelper';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface RootView extends View {
  name: 'root';
}

export default class RootViewHandler extends BaseViewHandler<RootView> {

  async browse(): Promise<RenderedPage> {
    const [ liveStreams, categories, featured ] = await Promise.all([
      this.#getLiveStreams(),
      this.#getCategories(),
      this.#getFeatured()
    ]);

    return {
      navigation: {
        prev: { uri: '/' },
        lists: [
          ...liveStreams,
          ...categories,
          ...featured
        ]
      }
    };
  }

  async #getCategories(): Promise<RenderedList[]> {
    const categories = await this.getModel(ModelType.Discover).getCategories();
    const renderer = this.getRenderer(RendererType.Slug);
    const lists: RenderedList[] = [];
    const sections = Object.keys(categories);
    for (const section of sections) {
      const items = categories[section].reduce<RenderedListItem[]>((result, category) => {
        const rendered = renderer.renderToListItem(category);
        if (rendered) {
          result.push(rendered);
        }
        return result;
      }, []);
      let title = mixcloud.getI18n('MIXCLOUD_DISCOVER_SHOWS', section);
      if (UIHelper.supportsEnhancedTitles()) {
        title = UIHelper.styleText(title, UI_STYLES.TITLE_CASE);
        title = UIHelper.addMixcloudIconToListTitle(title);
      }
      lists.push({
        title,
        availableListViews: [ 'list', 'grid' ],
        items
      });
    }

    return lists;
  }

  async #getFeatured() {
    const uri = `${this.uri}/featured@inSection=1`;
    const handler = ViewHandlerFactory.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
  }

  async #getLiveStreams() {
    const uri = `${this.uri}/liveStreams@inSection=1`;
    const handler = ViewHandlerFactory.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
  }
}
