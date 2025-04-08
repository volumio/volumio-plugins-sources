import sc from '../../../SoundCloudContext';
import PlaylistEntity from '../../../entities/PlaylistEntity';
import { ModelType } from '../../../model';
import { PlaylistModelGetPlaylistParams } from '../../../model/PlaylistModel';
import { LoopFetchResult } from '../../../model/BaseModel';
import SetViewHandler, { SetView, SetViewHandlerGetSetsParams } from './SetViewHandler';
import { RendererType } from './renderers';
import BaseRenderer from './renderers/BaseRenderer';
import { TrackOrigin } from './TrackViewHandler';

export interface PlaylistView extends SetView {
  name: 'playlists';
  playlistId?: string;
  type?: 'system';
}

export default class PlaylistViewHandler extends SetViewHandler<PlaylistView, string | number, PlaylistEntity> {

  protected getSetIdFromView(): string | number | null | undefined {
    return this.currentView.playlistId;
  }

  protected getSet(id: string | number): Promise<{ set: PlaylistEntity; tracksOffset?: number; tracksLimit?: number; }> {
    return this.#getPlaylist(id);
  }

  protected getSets(modelParams: SetViewHandlerGetSetsParams): Promise<LoopFetchResult<PlaylistEntity>> {
    return this.getModel(ModelType.Playlist).getPlaylists(modelParams);
  }

  protected getSetsListTitle(): string {
    return sc.getI18n('SOUNDCLOUD_LIST_TITLE_PLAYLISTS');
  }

  protected getSetRenderer(): BaseRenderer<PlaylistEntity, PlaylistEntity> {
    return this.getRenderer(RendererType.Playlist);
  }

  protected getVisitLinkTitle(): string {
    return sc.getI18n('SOUNDCLOUD_VISIT_LINK_PLAYLIST');
  }

  protected getTrackOrigin(set: PlaylistEntity): TrackOrigin | null {
    if (set.type === 'playlist' && set.id) {
      return {
        type: 'playlist',
        playlistId: set.id
      };
    }
    else if (set.type === 'system-playlist' && set.id && set.urn) {
      return {
        type: 'system-playlist',
        playlistId: set.id,
        urn: set.urn
      };
    }
    return null;
  }

  async #getPlaylist(playlistId: string | number) {
    const { type, pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const loadAllTracks = sc.getConfigValue('loadFullPlaylistAlbum');

    const id = type === 'system' ? playlistId : Number(playlistId);

    const modelParams: PlaylistModelGetPlaylistParams = { loadTracks: true };
    if (type !== undefined) {
      modelParams.type = type;
    }
    if (Number(pageToken)) {
      modelParams.tracksOffset = Number(pageToken);
    }
    if (!loadAllTracks) {
      modelParams.tracksLimit = sc.getConfigValue('itemsPerPage');
    }

    const playlist = await this.getModel(ModelType.Playlist).getPlaylist(id, modelParams);

    if (!playlist) {
      throw Error('Failed to fetch playlist');
    }

    return {
      set: playlist,
      tracksOffset: modelParams.tracksOffset,
      tracksLimit: modelParams.tracksLimit
    };
  }
}
