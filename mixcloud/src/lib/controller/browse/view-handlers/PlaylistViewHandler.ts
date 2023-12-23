import mixcloud from '../../../MixcloudContext';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import { ModelType } from '../../../model';
import { RenderedListItem } from './renderers/BaseRenderer';
import UIHelper from '../../../util/UIHelper';
import ExplodableViewHandler from './ExplodableViewHandler';
import { RendererType } from './renderers';
import { PlaylistModelGetPlaylistsParams } from '../../../model/PlaylistModel';
import { CloudcastModelGetCloudcastsParams } from '../../../model/CloudcastModel';
import { LoopFetchResult } from '../../../model/BaseModel';
import { PlaylistEntity } from '../../../entities/PlaylistEntity';
import { UserEntity } from '../../../entities/UserEntity';

export interface PlaylistView extends View {
  name: 'playlist' | 'playlists';

  username?: string;

  // For explode
  playlistId?: string;
}

export default class PlaylistViewHandler extends ExplodableViewHandler<PlaylistView> {

  browse(): Promise<RenderedPage> {
    const view = this.currentView;
    if (view.username) {
      return this.#browseUserPlaylists(view.username);
    }
    throw Error('Operation not supported');
  }

  async #browseUserPlaylists(username: string) {
    const playlistParams: PlaylistModelGetPlaylistsParams = {
      username
    };

    const [ user, playlists ] = await Promise.all([
      this.getModel(ModelType.User).getUser(username),
      this.getModel(ModelType.Playlist).getPlaylists(playlistParams)
    ]);

    const lists: RenderedList[] = [];

    if (playlists.items.length > 0) {
      lists.push(this.#getPlaylistList(user, playlists));
      let listTitle = mixcloud.getI18n('MIXCLOUD_PLAYLISTS');
      if (!this.currentView.inSection) {
        const backLink = this.constructPrevViewLink(mixcloud.getI18n('MIXCLOUD_BACK_LINK_USER'));
        listTitle = UIHelper.constructListTitleWithLink(listTitle, backLink, true);
      }
      lists[0].title = listTitle;
    }

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        info: user ? this.getRenderer(RendererType.User).renderToHeader(user) : undefined,
        lists
      }
    };
  }

  #getPlaylistList(user: UserEntity | null, playlists: LoopFetchResult<PlaylistEntity>): RenderedList {
    const renderer = this.getRenderer(RendererType.Playlist);
    const items = playlists.items.reduce<RenderedListItem[]>((result, playlist) => {
      const rendered = renderer.renderToListItem({
        ...playlist,
        owner: user || undefined
      });
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);
    const nextPageRef = this.constructPageRef(playlists.nextPageToken, playlists.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      items.push(this.constructNextPageItem(nextUri));
    }

    return {
      availableListViews: [ 'list', 'grid' ],
      items
    };
  }

  protected async getStreamableEntitiesOnExplode() {
    const view = this.currentView;
    if (!view.playlistId) {
      throw Error('Operation not supported');
    }

    const cloudcastParams: CloudcastModelGetCloudcastsParams = {
      playlistId: view.playlistId,
      limit: mixcloud.getConfigValue('itemsPerPage')
    };

    const cloudcasts = await this.getModel(ModelType.Cloudcast).getCloudcasts(cloudcastParams);
    return cloudcasts.items;
  }
}
