import mixcloud from '../../../MixcloudContext';
import { ModelType } from '../../../model';
import { CloudcastModelGetCloudcastsParams } from '../../../model/CloudcastModel';
import UIHelper, { UILink, UI_STYLES } from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import { UserView } from './UserViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface CloudcastView extends View {
  name: 'cloudcast' | 'cloudcasts';

  cloudcastId?: string;

  showMoreFromUser?: '1';

  // User shows
  username?: string;
  orderBy?: CloudcastModelGetCloudcastsParams['orderBy'];

  // Playlist items
  playlistId?: string;

  // Search
  keywords?: string;
  dateUploaded?: CloudcastModelGetCloudcastsParams['dateUploaded'];

  // User shows / search - list options
  select?: 'dateUploaded' | 'orderBy';

  // For Goto
  owner?: string;
}

export default class CloudcastViewHandler extends ExplodableViewHandler<CloudcastView> {

  async browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.cloudcastId) {
      return this.#browseCloudcast(view.cloudcastId);
    }
    else if (view.username) {
      if (view.select) {
        return this.#browseUserShowOptionValues(view.select);
      }
      return this.#browseUserShows(view.username);

    }
    else if (view.playlistId) {
      return this.#browsePlaylistItems(view.playlistId);
    }
    else if (view.keywords) {
      if (view.select) {
        return this.#browseSearchOptionValues(view.select);
      }
      return this.#browseSearchResults(view.keywords);
    }

    throw Error('Operation not supported');
  }

  async #browseCloudcast(cloudcastId: string): Promise<RenderedPage> {
    const view = this.currentView;
    const model = this.getModel(ModelType.Cloudcast);
    const renderer = this.getRenderer(RendererType.Cloudcast);
    const cloudcast = await model.getCloudcast(cloudcastId);
    if (!cloudcast) {
      throw Error('Cloudcast does not exist!');
    }

    const lists: RenderedList[] = [];

    const playShowItem = renderer.renderToListItem(cloudcast, 'playShowItem');
    if (playShowItem) {
      lists.push({
        availableListViews: [ 'list' ],
        items: [ playShowItem ]
      });
    }

    if (view.showMoreFromUser && cloudcast.owner) {
      const userView: UserView = {
        name: 'user',
        username: cloudcast.owner.username
      };
      const moreFromUserItem: RenderedListItem = {
        service: 'mixcloud',
        type: 'item-no-menu',
        title: mixcloud.getI18n('MIXCLOUD_MORE_FROM', cloudcast.owner.name || cloudcast.owner.username),
        icon: 'fa fa-arrow-right',
        uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(userView)}@noExplode=1`
      };
      lists.push({
        availableListViews: [ 'list' ],
        items: [ moreFromUserItem ]
      });
    }

    if (UIHelper.supportsEnhancedTitles() && cloudcast.url && lists.length > 0) {
      let title = '';
      const link: UILink = {
        url: cloudcast.url,
        text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_SHOW'),
        icon: { type: 'mixcloud' },
        style: UI_STYLES.VIEW_LINK,
        target: '_blank'
      };
      title = UIHelper.constructListTitleWithLink('', link, true);
      if (cloudcast.description) {
        title += UIHelper.wrapInDiv(cloudcast.description, UI_STYLES.DESCRIPTION);
      }
      if (cloudcast.description) {
        title = UIHelper.wrapInDiv(title, 'width: 100%;');
      }
      else {
        title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
      }
      lists[0].title = title;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: renderer.renderToHeader(cloudcast),
        lists
      }
    };
  }

  async #browseUserShows(username: string): Promise<RenderedPage> {
    const view = this.currentView;

    const cloudcastParams: CloudcastModelGetCloudcastsParams = {
      username: username,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
      cloudcastParams.pageToken = view.pageRef.pageToken;
      cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.orderBy) {
      cloudcastParams.orderBy = view.orderBy;
    }

    const userModel = this.getModel(ModelType.User);
    const cloudcastModel = this.getModel(ModelType.Cloudcast);

    const [ cloudcasts, user ] = await Promise.all([
      cloudcastModel.getCloudcasts(cloudcastParams),
      userModel.getUser(username)
    ]);

    const lists: RenderedList[] = [];

    if (cloudcasts.items.length > 0) {
      const optionList = await this.getOptionList({
        getOptionBundle: async () => userModel.getShowsOptions(),
        currentSelected: cloudcasts.params
      });

      if (optionList) {
        lists.push(optionList);
      }

      lists.push(this.getCloudcastList(cloudcasts));

      lists[0].title = mixcloud.getI18n('MIXCLOUD_SHOWS');

      if (!this.currentView.inSection) {
        const backLink = this.constructPrevViewLink(mixcloud.getI18n('MIXCLOUD_BACK_LINK_USER'));
        lists[0].title = UIHelper.constructListTitleWithLink(lists[0].title, backLink, true);
      }
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: user ? this.getRenderer(RendererType.User).renderToHeader(user) : undefined,
        lists
      }
    };
  }


  async #browseUserShowOptionValues(option: string) {
    return this.browseOptionValues({
      getOptionBundle: async () => this.getModel(ModelType.User).getShowsOptions(),
      targetOption: option
    });
  }

  async #browseSearchOptionValues(option: string) {
    return this.browseOptionValues({
      getOptionBundle: async () => this.getModel(ModelType.Cloudcast).getSearchOptions(),
      targetOption: option
    });
  }

  async #browsePlaylistItems(playlistId: string): Promise<RenderedPage> {
    const view = this.currentView;

    const cloudcastParams: CloudcastModelGetCloudcastsParams = {
      playlistId,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
      cloudcastParams.pageToken = view.pageRef.pageToken;
      cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }

    const playlistModel = this.getModel(ModelType.Playlist);
    const cloudcastModel = this.getModel(ModelType.Cloudcast);

    const [ cloudcasts, playlist ] = await Promise.all([
      cloudcastModel.getCloudcasts(cloudcastParams),
      playlistModel.getPlaylist(playlistId)
    ]);

    const lists: RenderedList[] = [ this.getCloudcastList(cloudcasts) ];

    if (UIHelper.supportsEnhancedTitles() && playlist?.url) {
      let title = '';
      const link: UILink = {
        url: playlist.url,
        text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_PLAYLIST'),
        icon: { type: 'mixcloud' },
        style: UI_STYLES.VIEW_LINK,
        target: '_blank'
      };
      title = UIHelper.constructListTitleWithLink('', link, true);
      if (playlist.description) {
        title += UIHelper.wrapInDiv(playlist.description, UI_STYLES.DESCRIPTION);
      }
      if (playlist.description) {
        title = UIHelper.wrapInDiv(title, 'width: 100%;');
      }
      else {
        title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
      }
      lists[0].title = title;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: playlist ? this.getRenderer(RendererType.Playlist).renderToHeader(playlist) : undefined,
        lists
      }
    };
  }

  async #browseSearchResults(keywords: string): Promise<RenderedPage> {
    const view = this.currentView;

    const cloudcastParams: CloudcastModelGetCloudcastsParams = {
      keywords,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
      cloudcastParams.pageToken = view.pageRef.pageToken;
      cloudcastParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.dateUploaded !== undefined) {
      cloudcastParams.dateUploaded = view.dateUploaded;
    }

    const model = this.getModel(ModelType.Cloudcast);
    const cloudcasts = await model.getCloudcasts(cloudcastParams);
    const lists: RenderedList[] = [];

    const optionList = await this.getOptionList({
      getOptionBundle: async () => model.getSearchOptions(),
      currentSelected: cloudcasts.params,
      showOptionName: () => true
    });
    if (optionList) {
      lists.push(optionList);
    }

    lists.push(this.getCloudcastList(cloudcasts, true));

    let title;
    if (view.inSection) {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_SHOWS' : 'MIXCLOUD_SHOWS_FULL');
    }
    else {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_SHOWS_MATCHING' : 'MIXCLOUD_SHOWS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper.addMixcloudIconToListTitle(title);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  protected async getStreamableEntitiesOnExplode() {
    const view = this.currentView;
    const model = this.getModel(ModelType.Cloudcast);

    if (view.cloudcastId) {
      const cloudcast = await model.getCloudcast(view.cloudcastId);
      return cloudcast || [];
    }
    else if (view.username) {
      const cloudcastParams: CloudcastModelGetCloudcastsParams = {
        username: view.username,
        limit: mixcloud.getConfigValue('itemsPerPage')
      };

      if (view.pageRef) {
        cloudcastParams.pageToken = view.pageRef.pageToken;
        cloudcastParams.pageOffset = view.pageRef.pageOffset;
      }

      if (view.orderBy !== undefined) {
        cloudcastParams.orderBy = view.orderBy;
      }

      const cloudcasts = await model.getCloudcasts(cloudcastParams);
      return cloudcasts.items;
    }
    else if (view.playlistId) {
      const cloudcastParams: CloudcastModelGetCloudcastsParams = {
        playlistId: view.playlistId,
        limit: mixcloud.getConfigValue('itemsPerPage')
      };

      if (view.pageRef) {
        cloudcastParams.pageToken = view.pageRef.pageToken;
        cloudcastParams.pageOffset = view.pageRef.pageOffset;
      }

      const cloudcasts = await model.getCloudcasts(cloudcastParams);
      return cloudcasts.items;
    }

    throw Error('Operation not supported');
  }
}
