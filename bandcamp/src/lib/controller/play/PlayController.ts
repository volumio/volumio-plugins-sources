// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import bandcamp from '../../BandcampContext';
import { ExplodedTrackInfo } from '../browse/view-handlers/ExplodableViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import Model, { ModelType } from '../../model';
import { TrackView } from '../browse/view-handlers/TrackViewHandler';
import { ShowView } from '../browse/view-handlers/ShowViewHandler';
import { ArticleView } from '../browse/view-handlers/ArticleViewHandler';
import AlbumEntity from '../../entities/AlbumEntity';
import { ArticleEntityMediaItem } from '../../entities/ArticleEntity';
import TrackEntity from '../../entities/TrackEntity';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import { kewToJSPromise } from '../../util';

export default class PlayController {

  #mpdPlugin: any;

  constructor() {
    this.#mpdPlugin = bandcamp.getMpdPlugin();
  }

  /**
   * Track uri:
   * - bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
   * - bandcamp/show@showUrl={showUrl}
   * - bandcamp/article@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
   * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}@albumUrl={...}
   */
  async clearAddPlayTrack(track: ExplodedTrackInfo) {
    bandcamp.getLogger().info(`[bandcamp-play] clearAddPlayTrack: ${track.uri}`);

    let streamUrl;
    try {
      streamUrl = await this.#getStreamUrl(track);
    }
    catch (error: any) {
      bandcamp.getLogger().error(`[bandcamp-play] Error getting stream: ${error}`);
      throw error;
    }

    return this.#doPlay(streamUrl, track);
  }

  // Returns kew promise!
  stop() {
    bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.stop();
  }

  // Returns kew promise!
  pause() {
    bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.pause();
  }

  // Returns kew promise!
  resume() {
    bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.resume();
  }

  // Returns kew promise!
  seek(position: number) {
    bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.seek(position);
  }

  // Returns kew promise!
  next() {
    bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.next();
  }

  // Returns kew promise!
  previous() {
    bandcamp.getStateMachine().setConsumeUpdateService(undefined);
    return bandcamp.getStateMachine().previous();
  }

  async prefetch(track: ExplodedTrackInfo) {
    const prefetchEnabled = bandcamp.getConfigValue('prefetch', true);
    if (!prefetchEnabled) {
      /**
       * Volumio doesn't check whether `prefetch()` is actually performed or
       * successful (such as inspecting the result of the function call) -
       * it just sets its internal state variable `prefetchDone`
       * to `true`. This results in the next track being skipped in cases
       * where prefetch is not performed or fails. So when we want to signal
       * that prefetch is not done, we would have to directly falsify the
       * statemachine's `prefetchDone` variable.
       */
      bandcamp.getLogger().info('[bandcamp-play] Prefetch disabled');
      bandcamp.getStateMachine().prefetchDone = false;
      return;
    }
    let streamUrl;
    try {
      streamUrl = await this.#getStreamUrl(track, true);
    }
    catch (error: any) {
      bandcamp.getLogger().error(`[bandcamp] Prefetch failed: ${error}`);
      bandcamp.getStateMachine().prefetchDone = false;
      return;
    }

    const mpdPlugin = this.#mpdPlugin;
    return kewToJSPromise(mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, [])
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        bandcamp.getLogger().info(`[bandcamp-play] Prefetched and added track to MPD queue: ${track.name}`);
        return mpdPlugin.sendMpdCommand('consume 1', []);
      }));
  }

  async #getStreamUrl(track: ExplodedTrackInfo, isPrefetching = false): Promise<string> {

    const _toast = (type: 'error' | 'warning', msg: string) => {
      if (!isPrefetching) {
        bandcamp.toast(type, msg);
      }
    };

    const views = ViewHelper.getViewsFromUri(track.uri);
    let trackView = views[1];
    if (!trackView) {
      trackView = { name: '' };
    }
    if (trackView.name === 'track') {
      const { trackUrl } = trackView as TrackView;
      if (!trackUrl) {
        _toast('error', bandcamp.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
        throw Error('Track URL not specified');
      }
      const model = Model.getInstance(ModelType.Track);
      const trackInfo = await model.getTrack(trackUrl);
      if (!trackInfo.streamUrl) {
        _toast('warning', bandcamp.getI18n('BANDCAMP_SKIP_NON_PLAYABLE_TRACK', trackInfo.name));
        if (!isPrefetching) {
          bandcamp.getStateMachine().next();
        }
        throw Error('Skipping non-playable track');
      }
      else {
        const safeUri = trackInfo.streamUrl.replace(/"/g, '\\"');
        return safeUri;
      }
    }
    else if (trackView.name === 'show') {
      const { showUrl } = trackView as ShowView;
      if (!showUrl) {
        _toast('error', bandcamp.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
        throw Error('Show URL not specified');
      }
      const model = Model.getInstance(ModelType.Show);
      const showInfo = await model.getShow(showUrl);
      const streamUrl = showInfo.streamUrl;
      if (!streamUrl) {
        _toast('error', bandcamp.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', showInfo.name));
        throw Error(`Stream not found for show URL: ${showUrl}`);
      }
      const safeUri = streamUrl.replace(/"/g, '\\"');
      return safeUri;
    }
    else if (trackView.name === 'article') {
      const { articleUrl, mediaItemRef, track: trackPosition } = trackView as ArticleView;
      if (!articleUrl || !mediaItemRef) {
        _toast('error', bandcamp.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
        throw Error('Article URL, mediaItemRef or track position not specified');
      }
      const model = Model.getInstance(ModelType.Article);
      const article = await model.getArticle(articleUrl);
      const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === mediaItemRef);
      if (!mediaItem) {
        _toast('error', bandcamp.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', track.name));
        throw Error(`Target mediaItemRef '${mediaItemRef}' not found for article URL: ${articleUrl}`);
      }
      let matchedTrack: TrackEntity | undefined;
      if (mediaItem.type === 'album') {
        if (!trackPosition) {
          _toast('error', bandcamp.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
          throw Error(`Track position not specified for mediaItemRef '${mediaItemRef}' (article URL: ${articleUrl})`);
        }
        matchedTrack = (mediaItem as ArticleEntityMediaItem<AlbumEntity>).tracks?.find((tr) => tr.position?.toString() === trackPosition);
        if (!matchedTrack) {
          _toast('error', bandcamp.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', track.name));
          throw Error(`No track at position ${trackPosition} for mediaItemRef '${mediaItemRef}' (article URL: ${articleUrl})`);
        }
      }
      else {
        matchedTrack = mediaItem as ArticleEntityMediaItem<TrackEntity>;
      }
      if (matchedTrack.streamUrl) {
        const safeUri = matchedTrack.streamUrl.replace(/"/g, '\\"');
        return safeUri;
      }

      _toast('error', bandcamp.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', matchedTrack.name));
      throw Error(`Stream URL missing for track matching ${trackPosition ? `${trackPosition}@` : ''}${mediaItemRef} (article URL: ${articleUrl})`);

    }
    else if (trackView.name === 'album') {
      const { albumUrl, track: trackPosition } = trackView as AlbumView;
      if (!albumUrl || !trackPosition) {
        throw Error('Album URL or track position not specified');
      }
      const model = Model.getInstance(ModelType.Album);
      const album = await model.getAlbum(albumUrl);
      const albumTrack = album.tracks?.[parseInt(trackPosition, 10) - 1];
      if (albumTrack?.streamUrl) {
        const safeUri = albumTrack.streamUrl.replace(/"/g, '\\"');
        return safeUri;
      }
      _toast('error', bandcamp.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', albumTrack?.name || track.name));
      throw Error(`Track or stream URL missing at position ${trackPosition} for album URL: ${albumUrl}`);
    }

    _toast('error', bandcamp.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
    throw Error(`Invalid track URI: ${track.uri}`);
  }

  // Returns kew promise!
  #doPlay(streamUrl: string, track: ExplodedTrackInfo) {
    const mpdPlugin = this.#mpdPlugin;

    return mpdPlugin.sendMpdCommand('stop', [])
      .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
      })
      .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
      })
      .then((addIdResp: { Id: string }) => this.#mpdAddTags(addIdResp, track))
      .then(() => {
        bandcamp.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
      });
  }

  // Returns kew promise!
  #mpdAddTags(mpdAddIdResponse: { Id: string }, track: ExplodedTrackInfo) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
      const cmds = [];
      cmds.push({
        command: 'addtagid',
        parameters: [ songId, 'title', track.title ]
      });
      if (track.album) {
        cmds.push({
          command: 'addtagid',
          parameters: [ songId, 'album', track.album ]
        });
      }
      cmds.push({
        command: 'addtagid',
        parameters: [ songId, 'artist', track.artist ]
      });

      return this.#mpdPlugin.sendMpdCommandArray(cmds);
    }
    return libQ.resolve();
  }
}
