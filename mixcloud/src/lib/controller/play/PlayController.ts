// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import miniget from 'miniget';
import { Parser as m3u8Parser } from 'm3u8-parser';
import mixcloud from '../../MixcloudContext';
import { ExplodedTrackInfo } from '../browse/view-handlers/ExplodableViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import Model, { ModelType } from '../../model';
import LiveStreamProxy from './LiveStreamProxy';
import { kewToJSPromise } from '../../util';

interface StreamInfo {
  url: string;
  isHLS: boolean;
  liveStreamProxy?: LiveStreamProxy;
}

export default class PlayController {

  #mpdPlugin: any;

  constructor() {
    this.#mpdPlugin = mixcloud.getMpdPlugin();
  }

  /**
   * Track uri:
   * - mixcloud/cloudcast@cloudcastId={...}@owner={...}
   * - mixcloud/livestream@username={...}
   */
  async clearAddPlayTrack(track: ExplodedTrackInfo) {
    mixcloud.getLogger().info(`[mixcloud] clearAddPlayTrack: ${track.uri}`);

    let stream;
    try {
      stream = await this.#getStreamInfo(track);
    }
    catch (error: any) {
      mixcloud.getLogger().error(`[mixcloud] Error getting stream: ${error}`);
      throw error;
    }

    try {
      return await kewToJSPromise(this.#doPlay(stream.url, track));
    }
    catch (error) {
      if (stream.liveStreamProxy) {
        await stream.liveStreamProxy.kill();
      }
      throw error;
    }
  }

  // Returns kew promise!
  stop() {
    mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.stop();
  }

  // Returns kew promise!
  pause() {
    mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.pause();
  }

  // Returns kew promise!
  resume() {
    mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.resume();
  }

  // Returns kew promise!
  seek(position: number) {
    mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.seek(position);
  }

  // Returns kew promise!
  next() {
    mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
    return this.#mpdPlugin.next();
  }

  // Returns kew promise!
  previous() {
    mixcloud.getStateMachine().setConsumeUpdateService(undefined);
    return mixcloud.getStateMachine().previous();
  }

  async #getStreamInfo(track: ExplodedTrackInfo): Promise<StreamInfo> {
    const views = ViewHelper.getViewsFromUri(track.uri);
    let trackView = views[1];
    if (!trackView) {
      trackView = { name: '' };
    }
    let stream: StreamInfo | null = null;
    if (trackView.name === 'cloudcast' && trackView.cloudcastId) {
      const cloudcastId = trackView.cloudcastId;
      const cloudcast = await Model.getInstance(ModelType.Cloudcast).getCloudcast(cloudcastId);
      const streamUrl = cloudcast?.streams?.hls || cloudcast?.streams?.http || cloudcast?.streams?.dash || null;
      if (!streamUrl) {
        if (cloudcast?.isExclusive) {
          mixcloud.toast('warning', mixcloud.getI18n('MIXCLOUD_SKIP_EXCLUSIVE', track.name));
          mixcloud.getStateMachine().next();
          throw Error('Skipping exclusive cloudcast');
        }
        else {
          mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_NO_STREAM', track.name));
          if (!cloudcast) {
            throw Error(`Stream not found for cloudcastId: ${cloudcastId} (Cloudcast does not exist)`);
          }
          throw Error(`Stream not found for cloudcastId: ${cloudcastId} (URL: ${cloudcast.url})`);
        }
      }
      else {
        stream = {
          url: streamUrl,
          isHLS: !!cloudcast?.streams?.hls
        };
      }
    }
    else if (trackView.name === 'liveStream' && trackView.username) {
      const username = trackView.username;
      const liveStream = await Model.getInstance(ModelType.LiveStream).getLiveStream(username);
      if (!liveStream || !liveStream.streams?.hls) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_USER_NO_LIVE_STREAM', username));
        throw Error(`Live stream not found for user ${username}`);
      }
      if (!liveStream.isLive) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_LIVE_STREAM_ENDED', username));
        throw Error(`Live stream has ended for user ${username}`);
      }
      const proxy = new LiveStreamProxy(liveStream.streams.hls);
      try {
        const proxyStreamUrl = await proxy.start();
        stream = {
          url: proxyStreamUrl,
          isHLS: false,
          liveStreamProxy: proxy
        };
      }
      catch (error) {
        mixcloud.toast('error', mixcloud.getI18n(
          'MIXCLOUD_LIVE_STREAM_PROXY_START_ERR',
          error instanceof Error ? error.message : error));

        throw Error(`Live stream obtained for user ${username}, but failed to start live stream proxy for playback.`);
      }
      track.duration = 0;
    }
    if (stream) {
      if (stream.isHLS) {
        // We setConsumeUpdateService to ignore metadata, so statemachine will take sample rate and bit depth from
        // Trackblock, which we don't have...At best, if stream is HLS, we try to obtain the max bit rate (bandwidth) and set it
        // As the sample rate. Otherwise, statemachine will obtain the bitrate from MPD but this is not always available.
        const bandwidth = await this.#getBandwidthFromHLS(stream.url);
        if (bandwidth) {
          const bitrate = `${Math.floor(bandwidth / 1000)} kbps`;
          track.samplerate = bitrate;
        }
      }
      // Safe URL
      stream.url = stream.url.replace(/"/g, '\\"');

      return stream;
    }

    mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_INVALID_TRACK_URI', track.uri));
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
        mixcloud.getStateMachine().setConsumeUpdateService('mpd', true, false);
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

  async #getBandwidthFromHLS(streamUrl: string) {
    const body = await miniget(streamUrl).text();
    const parser = new m3u8Parser();
    parser.push(body);
    parser.end();
    const playlists = parser.manifest.playlists;
    if (playlists && Array.isArray(playlists)) {
      const attributes = playlists[0]?.attributes;
      if (attributes && typeof attributes === 'object' && Reflect.has(attributes, 'BANDWIDTH')) {
        const bandwidth = Reflect.get(attributes, 'BANDWIDTH');
        return Number(bandwidth) || null;
      }
    }
    return null;
  }
}
