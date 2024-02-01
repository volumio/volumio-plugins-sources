// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import sc from '../../SoundCloudContext';
import Model, { ModelType } from '../../model';
import { kewToJSPromise } from '../../util/Misc';
import TrackHelper from '../../util/TrackHelper';
import { QueueItem } from '../browse/view-handlers/ExplodableViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import { PlaylistView } from '../browse/view-handlers/PlaylistViewHandler';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import { UserView } from '../browse/view-handlers/UserViewHandler';
import { TrackView } from '../browse/view-handlers/TrackViewHandler';

export default class PlayController {

  #mpdPlugin: any;

  constructor() {
    this.#mpdPlugin = sc.getMpdPlugin();
  }

  /**
   * Track uri:
   * soundcloud/track@trackId=...
   */
  async clearAddPlayTrack(track: QueueItem) {
    sc.getLogger().info(`[soundcloud] clearAddPlayTrack: ${track.uri}`);

    const trackView = ViewHelper.getViewsFromUri(track.uri).pop() as TrackView | undefined;
    if (!trackView || trackView.name !== 'track' || !trackView.trackId) {
      throw Error(`Invalid track uri: ${track.uri}`);
    }

    const { trackId, origin } = trackView;
    const model = Model.getInstance(ModelType.Track);

    const trackData = await model.getTrack(Number(trackId));
    if (!trackData) {
      throw Error(`Failed to fetch track: ${track.uri}`);
    }

    if (trackData.playableState === 'blocked') {
      sc.toast('warning', sc.getI18n('SOUNDCLOUD_SKIP_BLOCKED_TRACK', track.title));
      sc.getStateMachine().next();
      return;
    }
    else if (trackData.playableState === 'snipped' && sc.getConfigValue('skipPreviewTracks')) {
      sc.toast('warning', sc.getI18n('SOUNDCLOUD_SKIP_PREVIEW_TRACK', track.title));
      sc.getStateMachine().next();
      return;
    }

    const transcodingUrl = TrackHelper.getPreferredTranscoding(trackData);
    if (!transcodingUrl) {
      throw Error('No transcoding found');
    }

    let streamingUrl = await model.getStreamingUrl(transcodingUrl);
    if (!streamingUrl) {
      throw Error('No stream found');
    }

    /**
     * 1. Add bitrate info to track
     * 2. Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
     * track type to URL query string as a dummy param.
     */
    if (streamingUrl.includes('.128.mp3')) { // 128 kbps mp3
      track.samplerate = '128 kbps';
      streamingUrl += '&_vt=.mp3';
    }
    else if (streamingUrl.includes('.64.opus')) { // 64 kbps opus
      track.samplerate = '64 kbps';
      streamingUrl += '&_vt=.opus';
    }

    const safeUri = streamingUrl.replace(/"/g, '\\"');
    await this.#doPlay(safeUri, track);

    if (sc.getConfigValue('addPlayedToHistory')) {
      await Model.getInstance(ModelType.Me).addToPlayHistory(trackData, origin);
    }
  }

  #doPlay(streamUrl: string, track: QueueItem) {
    const mpdPlugin = this.#mpdPlugin;

    return kewToJSPromise(mpdPlugin.sendMpdCommand('stop', [])
      .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
      })
      .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
      })
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      }));
  }

  // Returns kew promise!
  #mpdAddTags(mpdAddIdResponse: { Id: string }, track: QueueItem) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
      const cmds = [];
      cmds.push({
        command: 'addtagid',
        parameters: [ songId, 'title', this.#stripNewLine(track.title) ]
      });
      if (track.album) {
        cmds.push({
          command: 'addtagid',
          parameters: [ songId, 'album', this.#stripNewLine(track.album) ]
        });
      }
      if (track.artist) {
        cmds.push({
          command: 'addtagid',
          parameters: [ songId, 'artist', this.#stripNewLine(track.artist) ]
        });
      }

      return this.#mpdPlugin.sendMpdCommandArray(cmds);
    }
    return libQ.resolve();
  }

  // Returns kew promise!
  stop() {
    sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.stop();
  }

  // Returns kew promise!
  pause() {
    sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.pause();
  }

  // Returns kew promise!
  resume() {
    sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.resume();
  }

  // Returns kew promise!
  seek(position: number) {
    sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.seek(position);
  }

  // Returns kew promise!
  next() {
    sc.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.next();
  }

  // Returns kew promise!
  previous() {
    sc.getStateMachine().setConsumeUpdateService(undefined);
    return sc.getStateMachine().previous();
  }

  #stripNewLine(str: string) {
    return str.replace(/(\r\n|\n|\r)/gm, '');
  }

  async getGotoUri(type: 'album' | 'artist', uri: QueueItem['uri']): Promise<string | null> {
    const trackView = ViewHelper.getViewsFromUri(uri).pop() as TrackView | undefined;
    if (trackView && trackView.name === 'track' && trackView.trackId && (type === 'album' || type === 'artist')) {
      if (type === 'album' && trackView.origin) {
        const origin = trackView.origin;
        if (origin.type === 'album') {
          const albumView: AlbumView = {
            name: 'albums',
            albumId: origin.albumId.toString()
          };
          return `soundcloud/${ViewHelper.constructUriSegmentFromView(albumView)}`;
        }
        else if (origin.type === 'playlist' || origin.type === 'system-playlist') {
          const playlistView: PlaylistView = {
            name: 'playlists',
            playlistId: origin.playlistId.toString()
          };
          if (origin.type === 'system-playlist') {
            playlistView.type = 'system';
          }
          return `soundcloud/${ViewHelper.constructUriSegmentFromView(playlistView)}`;
        }
      }
      const track = await Model.getInstance(ModelType.Track).getTrack(Number(trackView.trackId));
      if (track && track.user?.id !== undefined) {
        const userView: UserView = {
          name: 'users',
          userId: track.user.id.toString()
        };
        return `soundcloud/${ViewHelper.constructUriSegmentFromView(userView)}`;
      }

    }
    return 'soundcloud';
  }
}
