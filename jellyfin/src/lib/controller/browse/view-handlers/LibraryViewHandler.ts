import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import BaseRenderer, { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import { GetItemsParams, GetItemsResult } from '../../../model/BaseModel';
import { EntityType } from '../../../entities';
import BaseEntity from '../../../entities/BaseEntity';
import { ExplodedTrackInfo } from './Explodable';
import ViewHandlerFactory from './ViewHandlerFactory';
import ViewHelper from './ViewHelper';
import { AlbumView } from './AlbumViewHandler';
import { ArtistView } from './ArtistViewHandler';
import { PlaylistView } from './PlaylistViewHandler';
import { GenreView } from './GenreViewHandler';
import { SongView } from './SongViewHandler';

export interface LibraryView extends View {
  name: 'library';
  parentId: string;
}

export default class LibraryViewHandler extends BaseViewHandler<LibraryView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const baseUri = this.uri;
    const view = this.currentView;
    const libraryId = view.parentId;

    const listPromises = [
      this.#getTopItemList(libraryId, baseUri)
    ];

    if (jellyfin.getConfigValue('showLatestMusicSection', true)) {
      listPromises.push(this.#getLatestMusic(libraryId, baseUri));
    }
    if (jellyfin.getConfigValue('showRecentlyPlayedSection', true)) {
      listPromises.push(this.#getRecentlyPlayed(libraryId, baseUri));
    }
    if (jellyfin.getConfigValue('showFrequentlyPlayedSection', true)) {
      listPromises.push(this.#getFrequentlyPlayed(libraryId, baseUri));
    }
    if (jellyfin.getConfigValue('showFavoriteArtistsSection', true)) {
      listPromises.push(this.#getFavoriteArtists(libraryId, baseUri));
    }
    if (jellyfin.getConfigValue('showFavoriteAlbumsSection', true)) {
      listPromises.push(this.#getFavoriteAlbums(libraryId, baseUri));
    }
    if (jellyfin.getConfigValue('showFavoriteSongsSection', true)) {
      listPromises.push(this.#getFavoriteSongs(libraryId, baseUri));
    }

    const lists = await Promise.all(listPromises);
    const cleanLists = lists.reduce<RenderedList[]>((result, list) => {
      if (list.items.length > 0) {
        result.push(list);
      }
      return result;
    }, []);

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists: cleanLists
    };

    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }

  async #getTopItemList(libraryId: string, baseUri: string): Promise<RenderedList> {
    const baseImgPath = 'music_service/jellyfin/dist/assets/images/';
    const listItems: RenderedListItem[] = [
      {
        service: 'jellyfin',
        type: 'folder',
        title: jellyfin.getI18n('JELLYFIN_ALBUMS'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<AlbumView>({ name: 'albums', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}album.png`
      },
      {
        service: 'jellyfin',
        type: 'streaming-category',
        title: jellyfin.getI18n('JELLYFIN_ALBUM_ARTISTS'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<ArtistView>({ name: 'albumArtists', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}avatar.png`
      },
      {
        service: 'jellyfin',
        type: 'streaming-category',
        title: jellyfin.getI18n('JELLYFIN_ARTISTS'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<ArtistView>({ name: 'artists', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}avatar.png`
      },
      {
        service: 'jellyfin',
        type: 'streaming-category',
        title: jellyfin.getI18n('JELLYFIN_PLAYLISTS'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<PlaylistView>({ name: 'playlists', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}playlist.png`
      },
      {
        service: 'jellyfin',
        type: 'streaming-category',
        title: jellyfin.getI18n('JELLYFIN_GENRES'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<GenreView>({ name: 'genres', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}genre.png`
      },
      {
        service: 'jellyfin',
        type: 'folder',
        title: jellyfin.getI18n('JELLYFIN_ALL_SONGS'),
        uri: `${baseUri}/${ViewHelper.constructUriSegmentFromView<SongView>({ name: 'songs', parentId: libraryId })}`,
        albumart: `/albumart?sourceicon=${baseImgPath}song.png`
      }
    ];

    const model = this.getModel(ModelType.UserView);
    const userView = await model.getUserView(libraryId);
    const title = userView?.name;

    return {
      title,
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  #getLatestMusic(libraryId: string, baseUri: string): Promise<RenderedList> {
    const params: GetItemsParams = {
      parentId: libraryId,
      sortBy: 'DateCreated,SortName',
      sortOrder: 'Descending,Ascending',
      limit: jellyfin.getConfigValue('latestMusicSectionItems', 11)
    };
    const albumView: AlbumView = {
      name: 'albums',
      parentId: libraryId,
      sortBy: 'DateCreated,SortName',
      sortOrder: 'Descending,Ascending',
      fixedView: 'latest'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(albumView)}`;

    return this.#getAlbumList(params, jellyfin.getI18n('JELLYFIN_LATEST_ALBUMS'), moreUri);
  }

  #getRecentlyPlayed(libraryId: string, baseUri: string): Promise<RenderedList> {
    const params: GetItemsParams = {
      parentId: libraryId,
      sortBy: 'DatePlayed,SortName',
      sortOrder: 'Descending,Ascending',
      filters: 'IsPlayed',
      limit: jellyfin.getConfigValue('recentlyPlayedSectionItems', 5)
    };
    const songView: SongView = {
      name: 'songs',
      parentId: libraryId,
      sortBy: 'DatePlayed,SortName',
      sortOrder: 'Descending,Ascending',
      filters: 'IsPlayed',
      fixedView: 'recentlyPlayed'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(songView)}`;

    return this.#getSongList(params, jellyfin.getI18n('JELLYFIN_RECENTLY_PLAYED_SONGS'), moreUri);
  }

  #getFrequentlyPlayed(libraryId: string, baseUri: string): Promise<RenderedList> {
    const params: GetItemsParams = {
      parentId: libraryId,
      sortBy: 'PlayCount,SortName',
      sortOrder: 'Descending,Ascending',
      filters: 'IsPlayed',
      limit: jellyfin.getConfigValue('frequentlyPlayedSectionItems', 5)
    };
    const songView: SongView = {
      name: 'songs',
      parentId: libraryId,
      sortBy: 'PlayCount,SortName',
      sortOrder: 'Descending,Ascending',
      filters: 'IsPlayed',
      fixedView: 'frequentlyPlayed'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(songView)}`;

    return this.#getSongList(params, jellyfin.getI18n('JELLYFIN_FREQUENTLY_PLAYED_SONGS'), moreUri);
  }

  #getFavoriteArtists(libraryId: string, baseUri: string): Promise<RenderedList> {
    const params: GetItemsParams = {
      parentId: libraryId,
      filters: 'IsFavorite',
      limit: jellyfin.getConfigValue('favoriteArtistsSectionItems', 5)
    };
    const artistView: ArtistView = {
      name: 'artists',
      parentId: libraryId,
      filters: 'IsFavorite',
      fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(artistView)}`;

    return this.#getArtistList(params, jellyfin.getI18n('JELLYFIN_FAVORITE_ARTISTS'), moreUri);
  }

  #getFavoriteAlbums(libraryId: string, baseUri: string) {
    const params: GetItemsParams = {
      parentId: libraryId,
      filters: 'IsFavorite',
      limit: jellyfin.getConfigValue('favoriteAlbumsSectionItems', 5)
    };
    const albumView: AlbumView = {
      name: 'albums',
      parentId: libraryId,
      filters: 'IsFavorite',
      fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(albumView)}`;

    return this.#getAlbumList(params, jellyfin.getI18n('JELLYFIN_FAVORITE_ALBUMS'), moreUri);
  }

  #getFavoriteSongs(libraryId: string, baseUri: string) {
    const params: GetItemsParams = {
      parentId: libraryId,
      filters: 'IsFavorite',
      limit: jellyfin.getConfigValue('favoriteSongsSectionItems', 5)
    };
    const songView: SongView = {
      name: 'songs',
      parentId: libraryId,
      filters: 'IsFavorite',
      fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper.constructUriSegmentFromView(songView)}`;

    return this.#getSongList(params, jellyfin.getI18n('JELLYFIN_FAVORITE_SONGS'), moreUri);
  }

  async #getAlbumList(params: GetItemsParams, title: string, moreUri: string): Promise<RenderedList> {
    return this.#getItemsResultToList(
      await this.getModel(ModelType.Album).getAlbums(params),
      this.getRenderer(EntityType.Album),
      title,
      moreUri
    );
  }

  async #getSongList(params: GetItemsParams, title: string, moreUri: string) {
    return this.#getItemsResultToList(
      await this.getModel(ModelType.Song).getSongs(params),
      this.getRenderer(EntityType.Song),
      title,
      moreUri
    );
  }

  async #getArtistList(params: GetItemsParams, title: string, moreUri: string): Promise<RenderedList> {
    return this.#getItemsResultToList(
      await this.getModel(ModelType.Artist).getArtists(params),
      this.getRenderer(EntityType.Artist),
      title,
      moreUri
    );
  }

  async #getItemsResultToList<E extends BaseEntity>(result: GetItemsResult<E>, renderer: BaseRenderer<E>, title: string, moreUri: string): Promise<RenderedList> {
    const listItems = result.items.map((entity) =>
      renderer.renderToListItem(entity)).filter((item) => item) as RenderedListItem[];
    if (result.nextStartIndex) {
      listItems.push(this.constructNextPageItem(moreUri, `<span style='color: #7a848e;'>${jellyfin.getI18n('JELLYFIN_VIEW_MORE')}</span>`));
    }
    listItems.push();
    return {
      title,
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }

  async explode(): Promise<ExplodedTrackInfo[]> {
    if (!this.serverConnection) {
      throw Error('No auth');
    }
    const songView: SongView = {
      name: 'songs',
      parentId: this.currentView.parentId
    };
    const uri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(songView)}`;
    const handler = await ViewHandlerFactory.getHandler(uri, this.serverConnection);
    return handler.explode();
  }
}
