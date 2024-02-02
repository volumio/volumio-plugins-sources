import mixcloud from '../../../MixcloudContext';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import { RenderedListItem } from './renderers/BaseRenderer';
import UIHelper from '../../../util/UIHelper';
import { RendererType } from './renderers';
import { LoopFetchResult } from '../../../model/BaseModel';
import BaseViewHandler from './BaseViewHandler';
import { TagModelGetTagsParams } from '../../../model/TagModel';
import { SlugEntity } from '../../../entities/SlugEntity';

export interface TagView extends View {
  name: 'tags';
  keywords: string;
}

export default class TagViewHandler extends BaseViewHandler<TagView> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.keywords) {
      return this.#browseSearchResults(view.keywords);
    }
    throw Error('Operation not supported');
  }

  async #browseSearchResults(keywords: string) {
    const view = this.currentView;

    const tagParams: TagModelGetTagsParams = {
      keywords,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };

    if (view.pageRef) {
      tagParams.pageToken = view.pageRef.pageToken;
      tagParams.pageOffset = view.pageRef.pageOffset;
    }

    const tags = await this.getModel(ModelType.Tag).getTags(tagParams);

    const lists: RenderedList[] = [ this.#getTagList(tags) ];

    let title;
    if (this.currentView.inSection) {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_TAGS' : 'MIXCLOUD_TAGS_FULL');
    }
    else {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_TAGS_MATCHING' : 'MIXCLOUD_TAGS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper.addMixcloudIconToListTitle(title);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getTagList(tags: LoopFetchResult<SlugEntity>): RenderedList {
    const renderer = this.getRenderer(RendererType.Slug);
    const items = tags.items.reduce<RenderedListItem[]>((result, tag) => {
      const rendered = renderer.renderToListItem(tag);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(tags.nextPageToken, tags.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      items.push(this.constructNextPageItem(nextUri));
    }

    return {
      availableListViews: [ 'list', 'grid' ],
      items
    };
  }
}
