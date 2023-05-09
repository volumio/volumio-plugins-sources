import { EntityType, Song } from '../../../entities';
import { ModelType } from '../../../model';
import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import View from './View';
import { RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import { RenderedListItem } from './renderer/BaseRenderer';
import { Explodable } from './Explodable';
import { FilterType } from '../../../model/filter/FilterModel';
import ViewHelper from './ViewHelper';

export interface SongView extends View {
  name: 'songs' | 'song';
  parentId?: string;
  albumId?: string;
  playlistId?: string;
  songId?: string;
  search?: string;
  collatedSearchResults?: '1';
}

class SongViewHandler extends FilterableViewHandler<SongView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const view = this.currentView;

    const albumId = view.albumId;
    const playlistId = view.playlistId;

    const isAlbum = !!albumId;
    const isPlaylist = !!playlistId;
    const listViewOnly = isAlbum || isPlaylist;

    let pagination: boolean;
    if ((isAlbum && jellyfin.getConfigValue('showAllAlbumTracks', true)) ||
      (isPlaylist && jellyfin.getConfigValue('showAllPlaylistTracks', true))) {
      pagination = false;
    }
    else {
      pagination = true;
    }

    const { lists, modelQueryParams } = await this.handleFilters();

    if (isAlbum) {
      modelQueryParams.parentId = albumId;

      if (jellyfin.getConfigValue('showAllAlbumTracks', true)) {
        modelQueryParams.limit = -1;
      }
    }
    else if (isPlaylist) {
      modelQueryParams.parentId = playlistId;
      modelQueryParams.sortBy = null;
      modelQueryParams.sortOrder = null;

      if (jellyfin.getConfigValue('showAllPlaylistTracks', true)) {
        modelQueryParams.limit = -1;
      }
    }
    else if (view.search && view.collatedSearchResults) {
      modelQueryParams.limit = jellyfin.getConfigValue('searchSongsResultCount', 11);
    }

    const model = this.getModel(ModelType.Song);
    const renderer = this.getRenderer(EntityType.Song);
    const songs = await model.getSongs(modelQueryParams);
    const listItems = songs.items.map((song) =>
      renderer.renderToListItem(song)).filter((item) => item) as RenderedListItem[];

    if (pagination && songs.nextStartIndex) {
      if (view.search && view.collatedSearchResults && this.serverConnection) {
        const songView: SongView = {
          name: 'songs',
          search: view.search
        };
        const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper.constructUriSegmentFromView(songView)}`;
        listItems.push(this.constructMoreItem(moreUri));
      }
      else {
        const nextUri = this.constructNextUri(songs.nextStartIndex);
        listItems.push(this.constructNextPageItem(nextUri));
      }
    }

    lists.push({
      availableListViews: listViewOnly || listItems.length === 0 ? [ 'list' ] : [ 'list', 'grid' ],
      items: listItems
    });

    let header, headerData, headerRenderer;
    if (isAlbum) {
      const albumModel = this.getModel(ModelType.Album);
      headerData = await albumModel.getAlbum(albumId);
      headerRenderer = this.getRenderer(EntityType.Album);
      if (headerData) {
        header = headerRenderer.renderToHeader(headerData);
      }
    }
    else if (isPlaylist) {
      const playlistModel = this.getModel(ModelType.Playlist);
      headerData = await playlistModel.getPlaylist(playlistId);
      headerRenderer = this.getRenderer(EntityType.Playlist);
      if (headerData) {
        header = headerRenderer.renderToHeader(headerData);
      }
    }

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      info: header || undefined,
      lists
    };

    if (!header) {
      await this.setPageTitle(pageContents);
    }

    return {
      navigation: pageContents
    };
  }

  async getSongsOnExplode(): Promise<Song[]> {
    const view = this.currentView;
    const model = this.getModel(ModelType.Song);

    if (view.name === 'song' && view.songId) {
      const song = await model.getSong(view.songId);
      if (song) {
        return [ song ];
      }
      throw Error('Song not found');
    }
    else if (view.name === 'songs') {
      const { modelQueryParams } = await this.handleFilters();
      modelQueryParams.limit = jellyfin.getConfigValue('maxTracks', 100);

      if (view.albumId) {
        modelQueryParams.parentId = view.albumId;

        if (jellyfin.getConfigValue('noMaxTracksSingleAlbum', true)) {
          modelQueryParams.limit = -1;
        }
      }
      else if (view.playlistId) {
        modelQueryParams.parentId = view.playlistId;

        if (jellyfin.getConfigValue('noMaxTracksSinglePlaylist', true)) {
          modelQueryParams.limit = -1;
        }
      }

      return (await model.getSongs(modelQueryParams)).items;
    }
    else {
      // Should never reach here, but just in case...
      throw Error(`View name is ${view.name} but handler is for song`);
    }
  }

  protected getFilterableViewConfig(): FilterableViewConfig {
    const view = this.currentView;
    const albumId = view.albumId;
    const playlistId = view.playlistId;
    const isAlbum = !!albumId;
    const isPlaylist = !!playlistId;

    const showFilters = !view.fixedView && !view.search && !isAlbum && !isPlaylist;
    const saveFiltersKey = `${view.parentId}.song`;
    const filterTypes = [ FilterType.Sort, FilterType.Filter, FilterType.Genre, FilterType.Year ];

    return {
      showFilters,
      saveFiltersKey,
      filterTypes
    };
  }
}

export default Explodable(SongViewHandler);
