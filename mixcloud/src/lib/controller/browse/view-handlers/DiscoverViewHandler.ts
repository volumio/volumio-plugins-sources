import mixcloud from '../../../MixcloudContext';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import { RenderedListItem } from './renderers/BaseRenderer';
import { DiscoverLoopFetchResult, DiscoverModelDiscoverParams, DiscoverResultsOrderBy, DiscoverType } from '../../../model/DiscoverModel';
import UIHelper from '../../../util/UIHelper';
import { SlugEntity } from '../../../entities/SlugEntity';
import ExplodableViewHandler from './ExplodableViewHandler';
import { FeaturedView } from './FeaturedViewHandler';
import ViewHelper from './ViewHelper';

export interface DiscoverView<T extends DiscoverType = 'all'> extends View {
  name:
    T extends 'all' ? 'discover' :
    T extends 'featured' ? 'featured' :
    never;

  slug?: string;

  orderBy?: DiscoverResultsOrderBy<T>;

  country?:
    T extends 'all' ? string :
    T extends 'featured' ? 'undefined' :
    never;

  select?:
    T extends 'all' ? 'orderBy' | 'slug' | 'country' :
    T extends 'featured' ? 'orderBy' | 'slug' :
    never;
}

export default class DiscoverViewHandler<T extends DiscoverType = 'all'> extends ExplodableViewHandler<DiscoverView<T>> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.select) {
      return this.#browseDiscoverOptions(view.select);
    }

    return this.#browseDiscoverResults();
  }

  protected getListType(): DiscoverType {
    return 'all';
  }

  protected getSwitchViewLinkData(selectedTags: SlugEntity[]) {
    // "View featured { tag } shows"
    const featuredView: FeaturedView = {
      name: 'featured',
      slug: selectedTags[0].slug
    };
    const tagNames = selectedTags.map((t) => t.name ).join(' &amp; ');
    return {
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(featuredView)}`,
      text: mixcloud.getI18n('MIXCLOUD_VIEW_FEATURED_SHOWS', tagNames)
    };
  }

  protected getTitle(selectedTags: SlugEntity[] = [], orderBy?: DiscoverResultsOrderBy<any>, country?: string) {
    const tagNames = selectedTags.map((t) => t.name).join(' &amp; ');
    const countryName = country ? `(${country})` : '';
    let i18nKey = 'MIXCLOUD_DISCOVER_TITLE';
    switch (orderBy) {
      case 'trending':
        i18nKey += '_TRENDING';
        break;
      case 'popular':
        i18nKey += '_POPULAR';
        break;
      case 'latest':
        i18nKey += '_LATEST';
        break;
    }
    const title = mixcloud.getI18n(i18nKey, tagNames, countryName);

    const featuredLinkData = this.getSwitchViewLinkData(selectedTags);
    const featuredLink = this.constructGoToViewLink(featuredLinkData.text, featuredLinkData.uri);

    return UIHelper.constructListTitleWithLink(title, featuredLink, true);
  }

  protected getDiscoverModelParams() {
    const view = this.currentView;

    const params: DiscoverModelDiscoverParams<any> = {
      list: this.getListType(),
      slug: view.slug,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };

    if (view.orderBy) {
      params.orderBy = view.orderBy;
    }

    // 'country' only available with 'all' discovery results and 'orderBy: trending'
    if (this.getListType() === 'all' && params.orderBy === 'trending' && view.country) {
      (params as DiscoverModelDiscoverParams<'all'>).country = view.country;
    }

    if (view.pageRef) {
      params.pageToken = view.pageRef.pageToken;
      params.pageOffset = view.pageRef.pageOffset;
    }

    return params;
  }

  async #browseDiscoverResults(): Promise<RenderedPage> {
    const view = this.currentView;

    const lists: RenderedList[] = [];
    const model = this.getModel(ModelType.Discover);
    const discoverParams = this.getDiscoverModelParams();
    const cloudcasts = await model.getDiscoverResults(discoverParams);

    const discoverOptions = await model.getDiscoverOptions({
      list: this.getListType(),
      orderBy: cloudcasts.params.orderBy
    });

    // Sanitize getOptionList() params
    const currentSelected: Record<string, any> = {
      ...cloudcasts.params
    };
    const selectedTags = cloudcasts.selectedTags;
    const ensureSlug = {
      name: selectedTags.length > 0 ?
        selectedTags.map((tag) => tag.name).join(', ') :
        mixcloud.getI18n('MIXCLOUD_ALL_CATEGORIES'),
      value: selectedTags.map((tag) => tag.slug).join('-')
    };
    currentSelected.slug = ensureSlug.value;
    if (!discoverOptions.slug.values.some((s) => s.value === ensureSlug.value)) {
      discoverOptions.slug.values.push(ensureSlug);
    }

    const optionList = await this.getOptionList({
      getOptionBundle: async () => discoverOptions,
      currentSelected
    });
    if (optionList) {
      lists.push(optionList);
    }

    lists.push(this.getCloudcastList(cloudcasts, true));

    let currentCountry: string | undefined;
    if (this.getListType() === 'all') {
      const _params = cloudcasts.params as DiscoverLoopFetchResult<'all'>['params'];
      currentCountry = discoverOptions.country.values.find((c) => c.value === _params.country)?.name;
    }

    lists[0].title = UIHelper.addMixcloudIconToListTitle(
      this.getTitle(
        cloudcasts.selectedTags,
        cloudcasts.params.orderBy,
        currentCountry
      ));

    if (!UIHelper.supportsEnhancedTitles() && !view.inSection && cloudcasts.selectedTags.length > 0) {
      // Compensate for loss of switch view link
      const switchViewLinkData = this.getSwitchViewLinkData(cloudcasts.selectedTags);
      const switchViewListItem: RenderedListItem = {
        service: 'mixcloud',
        type: 'item-no-menu',
        title: switchViewLinkData.text,
        uri: switchViewLinkData.uri,
        icon: 'fa fa-arrow-circle-right'
      };
      lists.push({
        availableListViews: [ 'list' ],
        items: [ switchViewListItem ]
      });
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #browseDiscoverOptions(option: string) {
    return this.browseOptionValues({
      getOptionBundle: () => this.getModel(ModelType.Discover).getDiscoverOptions({
        list: this.getListType(),
        orderBy: this.currentView.orderBy
      }),
      targetOption: option
    });
  }

  protected async getStreamableEntitiesOnExplode() {
    const cloudcasts = await this.getModel(ModelType.Discover)
      .getDiscoverResults(this.getDiscoverModelParams());

    return cloudcasts.items;
  }
}
