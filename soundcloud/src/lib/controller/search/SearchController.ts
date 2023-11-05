import sc from '../../SoundCloudContext';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import { PlaylistView } from '../browse/view-handlers/PlaylistViewHandler';
import { TrackView } from '../browse/view-handlers/TrackViewHandler';
import { UserView } from '../browse/view-handlers/UserViewHandler';
import { RenderedList } from '../browse/view-handlers/ViewHandler';
import ViewHandlerFactory from '../browse/view-handlers/ViewHandlerFactory';
import ViewHelper from '../browse/view-handlers/ViewHelper';

export interface SearchQuery {
  value: string;
}

export default class SearchController {

  async search(query: SearchQuery) {
    const safeQuery = query.value.replace(/"/g, '\\"');
    const userView: UserView = {
      name: 'users',
      search: safeQuery,
      combinedSearch: '1',
      title: this.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_USERS_MATCHING', query.value))
    };
    const searchUsersUri = `soundcloud/${ViewHelper.constructUriSegmentFromView(userView, true)}`;
    const albumView: AlbumView = {
      name: 'albums',
      search: safeQuery,
      combinedSearch: '1',
      title: this.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_ALBUMS_MATCHING', query.value))
    };
    const searchAlbumsUri = `soundcloud/${ViewHelper.constructUriSegmentFromView(albumView, true)}`;
    const playlistView: PlaylistView = {
      name: 'playlists',
      search: safeQuery,
      combinedSearch: '1',
      title: this.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS_MATCHING', query.value))
    };
    const searchPlaylistsUri = `soundcloud/${ViewHelper.constructUriSegmentFromView(playlistView, true)}`;
    const trackView: TrackView = {
      name: 'tracks',
      search: safeQuery,
      combinedSearch: '1',
      title: this.addIcon(sc.getI18n('SOUNDCLOUD_LIST_TITLE_TRACKS_MATCHING', query.value))
    };
    const searchTracksUri = `soundcloud/${ViewHelper.constructUriSegmentFromView(trackView, true)}`;

    const searches = [
      this.#doSearch(searchUsersUri, 'users'),
      this.#doSearch(searchAlbumsUri, 'albums'),
      this.#doSearch(searchPlaylistsUri, 'playlists'),
      this.#doSearch(searchTracksUri, 'tracks')
    ];

    const searchResults = await Promise.all(searches);
    const lists = searchResults.reduce<RenderedList[]>((result, sr) => {
      if (!sr) {
        return result;
      }
      const { list, type } = sr;
      switch (type) {
        case 'users':
          list.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_USERS');
          break;
        case 'albums':
          list.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_ALBUMS');
          break;
        case 'playlists':
          list.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_PLAYLISTS');
          break;
        case 'tracks':
          list.title = sc.getI18n('SOUNDCLOUD_LIST_TITLE_SEARCH_RESULTS_TRACKS');
          break;
        default:
          list.title = 'SoundCloud';
      }
      list.title = this.addIcon(list.title);
      result.push(list);
      return result;
    }, []);

    return lists;
  }

  async #doSearch(uri: string, type: 'users' | 'albums' | 'playlists' | 'tracks') {
    try {
      const page = await ViewHandlerFactory.getHandler(uri).browse();
      const list = page.navigation?.lists?.[0];
      if (list && list.items.length > 0) {
        return {
          list,
          type
        };
      }
      return null;
    }
    catch (error: any) {
      sc.getLogger().error(sc.getErrorMessage('[soundcloud] Search error:', error, true));
      return null;
    }
  }

  addIcon(s: string) {
    if (!ViewHelper.supportsEnhancedTitles()) {
      return s;
    }
    const icon = `<img src="/albumart?sourceicon=${encodeURIComponent('music_service/soundcloud/dist/assets/images/soundcloud.svg')}" style="width: 23px; height: 23px; margin-right: 8px; margin-top: -3px;" />`;
    return icon + s;
  }
}
