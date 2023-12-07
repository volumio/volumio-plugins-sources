import mixcloud from '../../../MixcloudContext';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import { RenderedListItem } from './renderers/BaseRenderer';
import UIHelper, { UILink, UI_STYLES } from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';
import { RendererType } from './renderers';
import { GetUsersLoopFetchResult, UserModelGetUsersParams } from '../../../model/UserModel';
import { CloudcastModelGetCloudcastsParams } from '../../../model/CloudcastModel';
import { CloudcastView } from './CloudcastViewHandler';
import ViewHelper from './ViewHelper';
import { PlaylistView } from './PlaylistViewHandler';

export interface UserView extends View {
  name: 'user' | 'users';

  username?: string;

  // Search
  keywords?: string;
  dateJoined?: UserModelGetUsersParams['dateJoined'];
  userType?: UserModelGetUsersParams['userType'];

  // Search options
  select?: 'dateJoined' | 'userType';

  // For explode
  playTarget?: 'liveStream';
}

export default class UserViewHandler extends ExplodableViewHandler<UserView> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.username) {
      return this.#browseUser(view.username);
    }
    else if (view.keywords) {
      if (view.select) {
        return this.#browseSearchOptions(view.select);
      }

      return this.#browseSearchResults(view.keywords);

    }
    throw Error('Operation not supported');
  }

  async #browseUser(username: string) {
    const [ user, liveStreamList, showList, playlistList ] = await Promise.all([
      this.getModel(ModelType.User).getUser(username),
      this.#getLiveStreamList(username),
      this.#getShows(username),
      this.#getPlaylists(username)
    ]);

    const lists: RenderedList[] = [
      ...liveStreamList,
      ...showList,
      ...playlistList
    ];

    let title = lists[0]?.title || '';
    if (UIHelper.supportsEnhancedTitles() && user?.url) {
      const firstTitle = title;
      const link: UILink = {
        url: user.url,
        text: mixcloud.getI18n('MIXCLOUD_VIEW_LINK_USER', user.name || user.username),
        icon: { type: 'mixcloud' },
        style: UI_STYLES.VIEW_LINK,
        target: '_blank'
      };
      title = UIHelper.constructListTitleWithLink('', link, true);
      if (user.about) {
        title += UIHelper.wrapInDiv(user.about, UI_STYLES.DESCRIPTION);
        title += UIHelper.wrapInDiv(' ', 'padding-top: 36px;');
      }
      title += firstTitle;
      if (user.about) {
        title = UIHelper.wrapInDiv(title, 'width: 100%;');
      }
      else {
        title = UIHelper.wrapInDiv(title, 'width: 100%; margin-bottom: -24px;');
      }
    }
    if (lists.length > 0) {
      lists[0].title = title;
    }
    else {
      lists.push({
        title,
        availableListViews: [ 'list', 'grid' ],
        items: []
      });
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: user ? this.getRenderer(RendererType.User).renderToHeader(user) : undefined,
        lists
      }
    };
  }

  async #getLiveStreamList(username: string): Promise<RenderedList[]> {
    const liveStream = await this.getModel(ModelType.LiveStream).getLiveStream(username);
    if (!liveStream) {
      return [];
    }
    const rendered = this.getRenderer(RendererType.LiveStream).renderToListItem(liveStream, 'playLiveStreamItem');
    if (!rendered) {
      return [];
    }
    let title = mixcloud.getI18n('MIXCLOUD_LIVE_STREAMING_NOW');
    if (UIHelper.supportsEnhancedTitles() && liveStream.description) {
      title += UIHelper.wrapInDiv(liveStream.description, UI_STYLES.DESCRIPTION);
      if (!liveStream.owner?.about) {
        title += UIHelper.wrapInDiv(' ', 'padding-top: 18px;');
      }
      title = UIHelper.wrapInDiv(title, 'width: 100%;');
    }
    return [ {
      availableListViews: [ 'list' ],
      title,
      items: [ rendered ]
    } ];
  }

  async #getShows(username: string) {
    const cloudcastView: CloudcastView = {
      name: 'cloudcasts',
      username
    };
    const uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(cloudcastView)}@inSection=1`;
    const handler = ViewHandlerFactory.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
  }

  async #getPlaylists(username: string) {
    const playlistView: PlaylistView = {
      name: 'playlists',
      username
    };
    const uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(playlistView)}@inSection=1`;
    const handler = ViewHandlerFactory.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
  }

  #getUserList(users: GetUsersLoopFetchResult): RenderedList {
    const renderer = this.getRenderer(RendererType.User);
    const items = users.items.reduce<RenderedListItem[]>((result, user) => {
      const rendered = renderer.renderToListItem(user);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(users.nextPageToken, users.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      items.push(this.constructNextPageItem(nextUri));
    }
    return {
      availableListViews: [ 'list', 'grid' ],
      items
    };
  }

  async #browseSearchResults(keywords: string) {
    const view = this.currentView;

    const userParams: UserModelGetUsersParams = {
      keywords,
      limit: view.inSection ? mixcloud.getConfigValue('itemsPerSection') : mixcloud.getConfigValue('itemsPerPage'),
      dateJoined: view.dateJoined,
      userType: view.userType
    };

    if (view.pageRef) {
      userParams.pageToken = view.pageRef.pageToken;
      userParams.pageOffset = view.pageRef.pageOffset;
    }

    const model = this.getModel(ModelType.User);
    const users = await model.getUsers(userParams);
    const lists: RenderedList[] = [];

    const optionList = await this.getOptionList({
      getOptionBundle: async () => model.getSearchOptions(),
      currentSelected: users.params,
      showOptionName: () => true
    });
    if (optionList) {
      lists.push(optionList);
    }

    lists.push(this.#getUserList(users));

    let title;
    if (view.inSection) {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_USERS' : 'MIXCLOUD_USERS_FULL');
    }
    else {
      title = mixcloud.getI18n(UIHelper.supportsEnhancedTitles() ? 'MIXCLOUD_USERS_MATCHING' : 'MIXCLOUD_USERS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper.addMixcloudIconToListTitle(title);

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };
  }

  #browseSearchOptions(option: string) {
    return this.browseOptionValues({
      getOptionBundle: async () => this.getModel(ModelType.User).getSearchOptions(),
      targetOption: option
    });
  }

  protected async getStreamableEntitiesOnExplode() {
    const view = this.currentView;
    if (!view.username) {
      throw Error('Operation not supported');
    }

    if (view.playTarget === 'liveStream') {
      const liveStream = await this.getModel(ModelType.LiveStream).getLiveStream(view.username);
      if (!liveStream) {
        return [];
      }
      return liveStream;
    }

    const cloudcastParams: CloudcastModelGetCloudcastsParams = {
      username: view.username,
      limit: mixcloud.getConfigValue('itemsPerPage')
    };
    const cloudcasts = await this.getModel(ModelType.Cloudcast).getCloudcasts(cloudcastParams);
    return cloudcasts.items;
  }
}
