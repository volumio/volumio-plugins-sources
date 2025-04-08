import mixcloud from '../../../MixcloudContext';
import { DiscoverType } from '../../../model/DiscoverModel';
import UIHelper from '../../../util/UIHelper';
import { SlugEntity } from '../../../entities/SlugEntity';
import DiscoverViewHandler, { DiscoverView } from './DiscoverViewHandler';
import ViewHelper from './ViewHelper';

export type FeaturedView = DiscoverView<'featured'>;

export default class FeaturedViewHandler extends DiscoverViewHandler<'featured'> {

  protected getListType(): DiscoverType {
    return 'featured';
  }

  protected getTitle(selectedTags: SlugEntity[]): string {
    const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
    let title = mixcloud.getI18n('MIXCLOUD_FEATURED_TITLE', tagNames);
    if (!this.currentView.inSection && selectedTags.length > 0) {
      const discoverLinkData = this.getSwitchViewLinkData(selectedTags);
      const discoverLink = this.constructGoToViewLink(discoverLinkData.text, discoverLinkData.uri);
      title = UIHelper.constructListTitleWithLink(title, discoverLink, true);
    }
    return title;
  }

  getSwitchViewLinkData(selectedTags: SlugEntity[]) {
    // "View all { tag } shows"
    const discoverView: DiscoverView = {
      name: 'discover',
      slug: selectedTags[0].slug
    };
    const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
    return {
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(discoverView)}`,
      text: mixcloud.getI18n('MIXCLOUD_VIEW_ALL_SHOWS', tagNames)
    };
  }
}
