import ConnectionManager from '../connection/ConnectionManager';
import ServerConnection from '../connection/ServerConnection';
import { SongView } from '../controller/browse/view-handlers/SongViewHandler';
import ViewHandlerFactory from '../controller/browse/view-handlers/ViewHandlerFactory';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import { Song } from '../entities';
import { ModelType } from '../model';

export interface SetSongFavoriteResult {
  songId: string,
  canonicalUri: string | null,
  favorite: boolean
}

export default class SongHelper {

  static async setFavoriteByUri(uri: string, favorite: boolean, connectionManager: ConnectionManager): Promise<SetSongFavoriteResult> {
    const handler = await ViewHandlerFactory.getHandler(uri, connectionManager);
    const songId = handler.currentView.songId;
    if (handler.currentView.name !== 'song' || !songId) {
      throw Error(`Failed to obtain song Id from uri: ${uri}`);
    }
    const songModel = handler.getModel(ModelType.Song);
    let favoriteResult: boolean;
    if (favorite) {
      favoriteResult = await songModel.markFavorite(songId);
    }
    else {
      favoriteResult = await songModel.unmarkFavorite(songId);
    }
    if (favoriteResult !== favorite) {
      throw Error('Updated status in response does not match value requested');
    }
    return {
      songId,
      canonicalUri: this.getCanonicalUri(songId, handler.serverConnection),
      favorite: favoriteResult
    };
  }

  // Canonical URI format:
  // Jellyfin/{username}@{serverId}/song@songId={songId}
  static getCanonicalUri(songTarget: Song | string, connection: ServerConnection | null): string | null {
    if (typeof songTarget === 'object') {
      return this.getCanonicalUri(songTarget.id, connection);
    }
    if (connection) {
      const songView: SongView = {
        name: 'song',
        songId: songTarget
      };
      return `jellyfin/${connection.id}/${ViewHelper.constructUriSegmentFromView(songView)}`;
    }
    return null;
  }
}
