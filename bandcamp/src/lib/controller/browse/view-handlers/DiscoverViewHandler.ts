import { type DiscoverOptions, type DiscoverParams } from 'bandcamp-fetch';
import bandcamp from '../../../BandcampContext';
import type View from './View';
import { type RenderedList, type RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { type RenderedListItem } from './renderers/BaseRenderer';
import { type DiscoverLoopFetchResult, type DiscoveryModelGetDiscoverResultParams } from '../../../model/DiscoverModel';
import UIHelper, { type UILink, UI_STYLES } from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import type TrackEntity from '../../../entities/TrackEntity';
import { type AlbumView } from './AlbumViewHandler';

export interface DiscoverView extends View {
  name: 'discover';
  select?: 'genre' | 'subgenre' | 'sortBy' | 'location' | 'category' | 'time' | 'relatedTag';
  genre?: string;
  subgenre?: string;
  sortBy?: string;
  location?: string;
  category?: string;
  time?: string;
  customTags?: string;
}

const DISCOVER_OPTION_ICONS: Record<string, string> = {
  genre: 'fa fa-music',
  subgenre: 'fa fa-filter',
  sortBy: 'fa fa-sort',
  location: 'fa fa-map-marker',
  category: 'fa fa-archive',
  time: 'fa fa-clock-o',
  relatedTag: 'fa fa-tag'
};

export default class DiscoverViewHandler extends ExplodableViewHandler<DiscoverView> {

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
    }
    if (view.location) {
      params.location = Number(view.location);
    }
    if (view.category) {
      params.category = Number(view.category);
    }
    if (view.time) {
      params.time = parseInt(view.time, 10);
    }
    if (view.customTags) {
      params.customTags = view.customTags.split(',');
    }

    if (Object.keys(params).length) {
      return params;
    }

    const defaultParams = bandcamp.getConfigValue('defaultDiscoverParams', null, true);
    return defaultParams || {};
  }

  #getParamsListFromDiscoverResult(_params: DiscoverParams, discoverOptions: DiscoverOptions): RenderedList {
    const params = {..._params};
    const defaultAllGenres = !params.genre && (!params.customTags || params.customTags.length === 0);
    const defaultAllSubgenres = params.genre && !params.subgenre;
    const baseUri = this.#constructUriWithParams(params);
    const listItems: RenderedListItem[] = [];
    [ 'genre', 'subgenre', 'sortBy', 'location', 'category', 'time' ].forEach((o) => {
      const paramValue = params[o as keyof DiscoverParams];
      if (paramValue !== undefined || (o === 'genre' && defaultAllGenres) || (o === 'subgenre' && defaultAllSubgenres)) {
        let optKey;
        switch (o) {
          case 'category':
            optKey = 'categories';
            break;
          default:
            optKey = `${o}s`;
        }
        let optArr = discoverOptions[optKey as keyof DiscoverOptions] || [];
        if (o === 'subgenre') {
          optArr = params.genre ? (optArr as DiscoverOptions['subgenres'])[params.genre] || [] : [];
        }
        if (optArr.length) {
          const opts = optArr as Array<any>;
          const opt = opts.find((o: any) => o.value == paramValue);
          let title;
          if (o === 'genre' && defaultAllGenres) {
            title = bandcamp.getI18n('BANDCAMP_ALL_GENRES');
          }
          else if (o === 'subgenre' && defaultAllSubgenres) {
            const genre = discoverOptions.genres.find((g) => g.value === params.genre);
            title = bandcamp.getI18n('BANDCAMP_ALL_SUBGENRES', genre ? genre.name : params.genre);
          }
          else {
            title = opt ? opt.name : opts[0].name;
          }
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
    if (params.customTags && params.customTags.length > 0) {
      listItems.unshift({
        service: 'bandcamp',
        type: 'item-no-menu',
        title: bandcamp.getI18n('BANDCAMP_SELECT_RELATEDTAG'),
        icon: DISCOVER_OPTION_ICONS['relatedTag'],
        uri: `${baseUri}@select=relatedTag`
      });
    }
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

    let title;
    if (params.customTags && params.customTags.length > 0) {
      title = params.customTags.join(', ');
    }
    else {
      title = UIHelper.constructListTitleWithLink(UIHelper.addBandcampIconToListTitle(bandcamp.getI18n(this.currentView.inSection ? 'BANDCAMP_DISCOVER_SHORT' : 'BANDCAMP_DISCOVER')), links, true);
    }

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

    const listItems = await (targetOption === 'relatedTag' ? this.#getRelatedTagListItems() : this.#getDiscoverOptionListItems(targetOption));
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

  async #getDiscoverOptionListItems(targetOption: Required<Exclude<DiscoverView['select'], 'relatedTag'>>) {
    const discoverOptions = await this.getModel(ModelType.Discover).getDiscoverOptions();
    let optKey;
    switch (targetOption) {
      case 'category':
        optKey = 'categories';
        break;
      default:
        optKey = `${targetOption}s`;
    }
    let optArr = discoverOptions[optKey as keyof DiscoverOptions] || [];
    const view = this.currentView;
    if (targetOption === 'subgenre' && optArr) {
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
        uri: this.#constructDiscoverOptionUri(targetOption as string, opt.value)
      };
    });

    if (targetOption === 'genre') {
      const isSelected = !view.genre;
      let title = bandcamp.getI18n('BANDCAMP_ALL_GENRES');
      if (isSelected) {
        title = UIHelper.styleText(title, UI_STYLES.LIST_ITEM_SELECTED);
      }
      listItems.unshift({
        service: 'bandcamp',
        type: 'item-no-menu',
        title,
        icon: isSelected ? 'fa fa-check' : 'fa',
        uri: this.#constructDiscoverOptionUri(targetOption as string, undefined)
      });
    }

    if (targetOption === 'subgenre' && view.genre) {
      const isSelected = !view.subgenre;
      const genre = discoverOptions.genres.find((g) => g.value === view.genre);
      let title = bandcamp.getI18n('BANDCAMP_ALL_SUBGENRES', genre ? genre.name : view.genre);
      if (isSelected) {
        title = UIHelper.styleText(title, UI_STYLES.LIST_ITEM_SELECTED);
      }
      listItems.unshift({
        service: 'bandcamp',
        type: 'item-no-menu',
        title,
        icon: isSelected ? 'fa fa-check' : 'fa',
        uri: this.#constructDiscoverOptionUri(targetOption as string, undefined)
      });
    }

    return listItems;
  }

  async #getRelatedTagListItems() {
    const view = this.currentView;
    const customTags = view.customTags?.split(',') || [];
    if (customTags.length === 0) {
      throw Error('No target tags specified');
    }
    const model = this.getModel(ModelType.Tag);
    const relatedTags = model.getRelatedTags(customTags);
    const listItems = (await relatedTags).map<RenderedListItem>((tag) => {
      const added = [ ...customTags, tag.value ];
      return {
        service: 'bandcamp',
        type: 'item-no-menu',
        title: tag.name,
        icon: 'fa',
        uri: this.#constructDiscoverOptionUri('customTags', added.join(','))
      };
    });

    return listItems;
  }

  #constructDiscoverOptionUri(option: string, value?: string) {
    const targetView = {
      ...this.currentView
    };
    if (this.currentView[option] !== value) {
      delete targetView.pageRef;
      delete targetView.prevPageRefs;
      if (value !== undefined) {
        targetView[option] = value;
      }
      else {
        delete targetView[option];
      }
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

  protected async getTracksOnExplode() {
    const view = this.currentView;
    const modelParams: DiscoveryModelGetDiscoverResultParams = {
      discoverParams: this.#getDiscoverParamsFromUriOrDefault(),
      limit: bandcamp.getConfigValue('itemsPerPage', 47)
    };
    const model = this.getModel(ModelType.Discover);
    const discoverResults = await model.getDiscoverResult(modelParams);
    const tracks = discoverResults.items.reduce<TrackEntity[]>((result, album) => {
      const featured = album.featuredTrack;
      if (featured?.streamUrl && featured.id) {
        result.push({
          type: 'track',
          id: featured.id,
          name: featured.name,
          url: album.url,
          thumbnail: album.thumbnail,
          artist: album.artist,
          album: {
            type: 'album',
            name: album.name,
            url: album.url
          },
          streamUrl: featured.streamUrl
        });
      }
      return result;
    }, []);

    return tracks;
  }

  /**
   * Override
   *
   * Add track uri:
   * - bandcamp/album@albumUrl={...}@trackId={...}@artistUrl={...}
   */
  getTrackUri(track: TrackEntity) {
    const artistUrl = track.artist?.url || null;
    const albumUrl = track.album?.url || artistUrl;

    if (track.album && albumUrl) {
      const albumView: AlbumView = {
        name: 'album',
        albumUrl
      };
      if (track.id) {
        albumView.trackId = String(track.id);
      }
      if (artistUrl) {
        albumView.artistUrl = artistUrl;
      }

      return `bandcamp/${ViewHelper.constructUriSegmentFromView(albumView)}`;
    }

    return super.getTrackUri(track);
  }
}
