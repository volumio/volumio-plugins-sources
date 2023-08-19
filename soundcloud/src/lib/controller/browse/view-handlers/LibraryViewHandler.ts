import sc from '../../../SoundCloudContext';
import AlbumEntity from '../../../entities/AlbumEntity';
import PlaylistEntity from '../../../entities/PlaylistEntity';
import { ModelType } from '../../../model';
import { MeModelGetLibraryItemsParams } from '../../../model/MeModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface LibraryView extends View {
  name: 'library';
  type: 'album' | 'playlist' | 'station';
  filter?: 'liked' | 'created' | 'all'; // Only for 'album' and 'playlist' types
  selectFilter?: '1';
}

export default class LibraryViewHandler extends BaseViewHandler<LibraryView> {

  async browse(): Promise<RenderedPage> {
    const { type, pageRef, filter = 'all', selectFilter = false } = this.currentView;

    if (selectFilter && (type === 'album' || type === 'playlist')) {
      return this.#browseFilters();
    }

    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;
    const modelParams: MeModelGetLibraryItemsParams = {
      type,
      limit: sc.getConfigValue('itemsPerPage'),
      filter
    };

    if (pageToken) {
      modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
      modelParams.pageOffset = pageRef.pageOffset;
    }

    const items = await this.getModel(ModelType.Me).getLibraryItems(modelParams);
    const page = this.buildPageFromLoopFetchResult(items, {
      render: this.#renderToListItem.bind(this)
    });

    // Filter
    const filterOptions = this.#getFilterOptions();
    const browseFilterView: LibraryView = {
      ...this.currentView,
      selectFilter: '1'
    };
    const browseFilterUri = ViewHelper.constructUriFromViews([
      ...this.previousViews,
      browseFilterView
    ]);
    const filterListItem: RenderedListItem = {
      service: 'soundcloud',
      type: 'item-no-menu',
      title: filterOptions.find((option) => option.value === filter)?.label || sc.getI18n('SOUNDCLOUD_FILTER_ALL'),
      icon: 'fa fa-filter',
      uri: browseFilterUri
    };
    const filterList: RenderedList = {
      title: this.#getTitle(),
      items: [ filterListItem ],
      availableListViews: [ 'list' ]
    };
    if (page.navigation?.lists) {
      page.navigation.lists.unshift(filterList);
    }

    return page;
  }

  #renderToListItem(item: AlbumEntity | PlaylistEntity) {
    if (item.type === 'album') {
      return this.getRenderer(RendererType.Album).renderToListItem(item, true);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
      return this.getRenderer(RendererType.Playlist).renderToListItem(item, true);
    }
    return null;
  }

  #getTitle() {
    const { type } = this.currentView;
    if (type === 'album') {
      return sc.getI18n('SOUNDCLOUD_ALBUMS');
    }
    else if (type === 'playlist') {
      return sc.getI18n('SOUNDCLOUD_PLAYLISTS');
    }
    else if (type === 'station') {
      return sc.getI18n('SOUNDCLOUD_STATIONS');
    }
    return undefined;
  }

  async #browseFilters(): Promise<RenderedPage> {
    const view = this.currentView;
    const { filter = 'all' } = view;

    const options = this.#getFilterOptions();

    const listItems = options.map<RenderedListItem>((option) => {
      const isSelected = option.value === filter;
      let title;
      if (isSelected) {
        title = `<span style='color: #54c688; font-weight: bold;'}>${option.label}</span>`;
      }
      else {
        title = option.label;
      }

      const viewWithSelectedOption: LibraryView = {
        ...this.currentView
      };
      if (this.currentView.filter !== option.value) {
        delete viewWithSelectedOption.pageRef;
        delete viewWithSelectedOption.prevPageRefs;
        viewWithSelectedOption.filter = option.value;
      }
      delete viewWithSelectedOption.selectFilter;

      const uriWithSelectedOption = ViewHelper.constructUriFromViews([
        ...this.previousViews,
        viewWithSelectedOption
      ]);

      return {
        service: 'soundcloud',
        type: 'item-no-menu',
        title,
        icon: isSelected ? 'fa fa-check' : 'fa',
        uri: uriWithSelectedOption
      };
    });

    const list: RenderedList = {
      availableListViews: [ 'list' ],
      items: listItems
    };

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [ list ]
      }
    };
  }

  #getFilterOptions() {
    const options: { label: string, value: NonNullable<LibraryView['filter']> }[] = [
      {
        label: sc.getI18n('SOUNDCLOUD_FILTER_ALL'),
        value: 'all'
      },
      {
        label: sc.getI18n('SOUNDCLOUD_FILTER_CREATED'),
        value: 'created'
      },
      {
        label: sc.getI18n('SOUNDCLOUD_FILTER_LIKED'),
        value: 'liked'
      }
    ];
    return options;
  }
}
