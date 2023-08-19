import sc from '../../../SoundCloudContext';
import { ModelType } from '../../../model';
import { UserModelGetUsersParams } from '../../../model/UserModel';
import { AlbumView } from './AlbumViewHandler';
import ExplodableViewHandler, { ExplodedTrackInfo } from './ExplodableViewHandler';
import { PlaylistView } from './PlaylistViewHandler';
import { TrackView } from './TrackViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';
import ViewHelper from './ViewHelper';
import { RendererType } from './renderers';

export interface UserView extends View {
  name: 'users';
  userId?: string;
  search?: string;
  myFollowing?: '1';
  combinedSearch?: '1';
  title?: string;
}

export default class UserViewHandler extends ExplodableViewHandler<UserView> {

  async browse(): Promise<RenderedPage> {
    const view = this.currentView;

    if (view.userId) {
      return this.browseUser(Number(view.userId));
    }

    const { pageRef, search, myFollowing, combinedSearch } = view;
    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;

    const modelParams: UserModelGetUsersParams = {};

    if (pageToken) {
      modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
      modelParams.pageOffset = pageRef.pageOffset;
    }

    if (search) {
      modelParams.search = search;
    }
    else if (myFollowing) {
      modelParams.myFollowing = true;
    }

    if (search && combinedSearch) {
      modelParams.limit = sc.getConfigValue('combinedSearchResults');
    }
    else {
      modelParams.limit = sc.getConfigValue('itemsPerPage');
    }

    const title = myFollowing ? sc.getI18n('SOUNDCLOUD_LIST_TITLE_FOLLOWING') : sc.getI18n('SOUNDCLOUD_LIST_TITLE_USERS');
    const result = await this.getModel(ModelType.User).getUsers(modelParams);
    return this.buildPageFromLoopFetchResult(result, {
      renderer: this.getRenderer(RendererType.User),
      title
    });
  }

  protected async browseUser(userId: number) {
    const albumView: AlbumView = {
      name: 'albums',
      userId: userId.toString(),
      inSection: '1',
      title: sc.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS')
    };
    const albumsUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView, true)}`;
    const playlistView: PlaylistView = {
      name: 'playlists',
      userId: userId.toString(),
      inSection: '1',
      title: sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS')
    };
    const playlistsUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(playlistView, true)}`;
    const trackView: TrackView = {
      name: 'tracks',
      userId: userId.toString(),
      inSection: '1',
      title: sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS')
    };
    const tracksUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(trackView, true)}`;

    const fetches = [
      this.#doFetch(albumsUri),
      this.#doFetch(playlistsUri),
      this.#doFetch(tracksUri)
    ];

    const subPages = await Promise.all(fetches);
    const lists = subPages.reduce<RenderedList[]>((result, page) => {
      const list = page.navigation?.lists?.[0];
      if (list && list.items.length > 0) {
        result.push(list);
      }
      return result;
    }, []);

    const page: RenderedPage = {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists
      }
    };

    try {
      const userData = await this.getModel(ModelType.User).getUser(userId);
      if (userData) {
        const header = this.getRenderer(RendererType.User).renderToHeader(userData);
        if (header && page.navigation) {
          page.navigation.info = header;
          if (userData.permalink && userData.username && lists.length > 0) {
            const title = lists[0].title;
            lists[0].title = this.addLinkToListTitle(
              title, userData.permalink, sc.getI18n('SOUNDCLOUD_VISIT_LINK_USER', userData.username));
          }
        }
      }
    }
    catch (error: any) {
      // Do nothing
    }

    return page;
  }

  #doFetch(uri: string) {
    const handler = ViewHandlerFactory.getHandler(uri);
    return handler.browse();
  }

  protected async getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    const { userId } = this.currentView;
    if (userId === undefined) {
      throw Error('User ID not specified');
    }
    const tracks = await this.getModel(ModelType.Track).getTracks({
      userId: Number(userId),
      limit: sc.getConfigValue('itemsPerPage')
    });

    return tracks.items;
  }
}
