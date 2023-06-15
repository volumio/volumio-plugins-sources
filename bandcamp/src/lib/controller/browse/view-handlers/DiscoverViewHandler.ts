import { DiscoverOptions, DiscoverParams } from 'bandcamp-fetch';
import bandcamp from '../../../BandcampContext';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';
import { DiscoverLoopFetchResult, DiscoveryModelGetDiscoverResultParams } from '../../../model/DiscoverModel';
import UIHelper, { UILink, UI_STYLES } from '../../../util/UIHelper';

export interface DiscoverView extends View {
  name: 'discover';
  select?: 'genre' | 'subgenre' | 'sortBy' | 'artistRecommendationType' |
  'location' | 'format' | 'time';
  genre?: string;
  subgenre?: string;
  sortBy?: string;
  artistRecommendationType?: string;
  location?: string;
  format?: string;
  time?: string;
}

const DISCOVER_OPTION_ICONS: Record<string, string> = {
  genre: 'fa fa-music',
  subgenre: 'fa fa-filter',
  sortBy: 'fa fa-sort',
  artistRecommendationType: 'fa fa-thumbs-o-up',
  location: 'fa fa-map-marker',
  format: 'fa fa-archive',
  time: 'fa fa-clock-o'
};

export default class DiscoverViewHandler extends BaseViewHandler<DiscoverView> {

  browse(): Promise<RenderedPage> {
    if (this.currentView.select) {
      return this.#browseDiscoverOptions();
    }

    return this.#browseDiscoverResult();

  }

  async #browseDiscoverResult(): Promise<RenderedPage> {
    const view = this.currentView;
    const modelParams: DiscoveryModelGetDiscoverResultParams = {
      discoverParams: this.#getDiscoverParamsFromUriOrDefault(),
      limit: view.inSection ? bandcamp.getConfigValue('itemsPerSectionDiscover', 11) : bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    const model = this.getModel(ModelType.Discover);
    const discoverResults = await model.getDiscoverResult(modelParams);
    const discoverOptions = await model.getDiscoverOptions();
    const lists = [
      this.#getParamsListFromDiscoverResult(discoverResults.params, discoverOptions),
      this.#getAlbumsListFromDiscoverResult(discoverResults)
    ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #getDiscoverParamsFromUriOrDefault(): DiscoverParams {
    const view = this.currentView;
    const params: DiscoverParams = {};
    if (view.genre) {
      params.genre = view.genre;

      if (view.subgenre) {
        params.subgenre = view.subgenre;
      }
    }
    if (view.sortBy) {
      params.sortBy = view.sortBy;

      if (view.artistRecommendationType) {
        params.artistRecommendationType = view.artistRecommendationType;
      }
    }
    if (view.location) {
      params.location = view.location;
    }
    if (view.format) {
      params.format = view.format;
    }
    if (view.time) {
      params.time = parseInt(view.time, 10);
    }

    if (Object.keys(params).length) {
      return params;
    }

    const defaultParams = bandcamp.getConfigValue('defaultDiscoverParams', null, true);
    return defaultParams || {};
  }

  #getParamsListFromDiscoverResult(params: DiscoverParams, discoverOptions: DiscoverOptions): RenderedList {
    const baseUri = this.#constructUriWithParams(params);
    const listItems: RenderedListItem[] = [];
    [ 'genre', 'subgenre', 'sortBy', 'artistRecommendationType', 'location', 'format', 'time' ].forEach((o) => {
      const paramValue = params[o as keyof DiscoverParams];
      if (paramValue !== undefined) {
        let optArr = discoverOptions[`${o}s` as keyof DiscoverOptions] || [];
        if (o === 'subgenre') {
          optArr = params.genre ? (optArr as DiscoverOptions['subgenres'])[params.genre] || [] : [];
        }
        if (optArr.length) {
          const opts = optArr as Array<any>;
          const opt = opts.find((o: any) => o.value == paramValue);
          const title = opt ? opt.name : opts[0].name;
          listItems.push({
            service: 'bandcamp',
            type: 'item-no-menu',
            title,
            icon: DISCOVER_OPTION_ICONS[o],
            uri: `${baseUri}@select=${o}`
          });
        }
      }
    });
    const setDefaultJS = `
                const params = ${JSON.stringify(params)};
                const payload = {
                    'endpoint': 'music_service/bandcamp',
                    'method': 'saveDefaultDiscoverParams',
                    'data': params
                };
                angular.element('#browse-page').scope().browse.socketService.emit('callMethod', payload);`;
    const setDefaultLink: UILink = {
      url: '#',
      icon: { type: 'fa', class: 'fa fa-cog' },
      text: bandcamp.getI18n('BANDCAMP_SET_DEFAULT_DISCOVER_PARAMS'),
      onclick: setDefaultJS.replace(/"/g, '&quot;').replace(/\r?\n|\r/g, '')
    };

    const links = [
      setDefaultLink,
      this.#getBrowseByTagsLink()
    ];

    const title = UIHelper.constructListTitleWithLink(UIHelper.addBandcampIconToListTitle(bandcamp.getI18n(this.currentView.inSection ? 'BANDCAMP_DISCOVER_SHORT' : 'BANDCAMP_DISCOVER')), links, true);

    if (!UIHelper.supportsEnhancedTitles()) {
      // Compensate for loss of 'browse by tags' link
      const browseByTagsLinkData = this.#getBrowseByTagsLinkData();
      listItems.push({
        service: 'bandcamp',
        type: 'item-no-menu',
        uri: browseByTagsLinkData.uri,
        title: browseByTagsLinkData.text,
        icon: 'fa fa-arrow-circle-right'
      });
    }

    return {
      title,
      availableListViews: [ 'list' ],
      items: listItems
    };
  }

  #getBrowseByTagsLink(): UILink {
    const linkData = this.#getBrowseByTagsLinkData();

    return {
      url: '#',
      text: linkData.text,
      onclick: `angular.element('#browse-page').scope().browse.fetchLibrary({uri: '${linkData.uri}'})`,
      icon: {
        type: 'fa',
        class: 'fa fa-arrow-circle-right',
        float: 'right',
        color: '#54c688'
      }
    };
  }

  #getBrowseByTagsLinkData() {
    return {
      uri: `${this.uri}/tag`,
      text: bandcamp.getI18n('BANDCAMP_BROWSE_BY_TAGS')
    };
  }

  #getAlbumsListFromDiscoverResult(discoverResult: DiscoverLoopFetchResult): RenderedList {
    const albumRenderer = this.getRenderer(RendererType.Album);
    const listItems = discoverResult.items.reduce<RenderedListItem[]>((result, album) => {
      const rendered = albumRenderer.renderToListItem(album);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(discoverResult.nextPageToken, discoverResult.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    return {
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  async #browseDiscoverOptions(): Promise<RenderedPage> {
    const view = this.currentView;
    const targetOption = view.select;
    if (!targetOption) {
      throw Error('Target option missing');
    }

    const discoverOptions = await this.getModel(ModelType.Discover).getDiscoverOptions();
    let optArr = discoverOptions[`${view.select}s` as keyof DiscoverOptions] || [];
    if (view.select === 'subgenre' && optArr) {
      optArr = view.genre ? (optArr as DiscoverOptions['subgenres'])[view.genre] || [] : [];
    }
    const listItems = (optArr as Array<any>).map<RenderedListItem>((opt) => {
      const isSelected = opt.value == view[view.select as keyof DiscoverView];
      let title = opt.name;
      if (isSelected) {
        title = UIHelper.styleText(title, UI_STYLES.LIST_ITEM_SELECTED);
      }

      return {
        service: 'bandcamp',
        type: 'item-no-menu',
        title,
        icon: isSelected ? 'fa fa-check' : 'fa',
        uri: this.#constructDiscoverOptionUri(targetOption, opt.value)
      };
    });

    let title = bandcamp.getI18n(`BANDCAMP_SELECT_${targetOption.toUpperCase()}`);
    title = UIHelper.addIconToListTitle(DISCOVER_OPTION_ICONS[targetOption], title);
    const lists: RenderedList[] = [ {
      title,
      availableListViews: [ 'list' ],
      items: listItems
    } ];

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #constructDiscoverOptionUri(option: string, value: string) {
    const targetView = {
      ...this.currentView
    };
    if (this.currentView[option] !== value) {
      delete targetView.pageRef;
      delete targetView.prevPageRefs;
      targetView[option] = value;
    }
    delete targetView.select;

    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }

  #constructUriWithParams(params: object) {
    const targetView = {
      ...this.currentView,
      ...params
    };
    return ViewHelper.constructUriFromViews([
      ...this.previousViews,
      targetView
    ]);
  }
}
