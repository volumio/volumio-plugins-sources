import { LongStreamFormat } from '../PluginConfig';
import sc from '../SoundCloudContext';
import TrackEntity from '../entities/TrackEntity';

export default class TrackHelper {

  static cacheTracks(tracks: TrackEntity[], cacheKeyGen: (keyData: Record<string, any>) => string) {
    const cache = sc.getCache();
    tracks.forEach((track) => {
      const keyData = { trackId: track.id };
      const key = cacheKeyGen(keyData);
      cache.put(key, track);
    });
  }

  static getPreferredTranscoding(track: TrackEntity) {
    /**
     * // soundcloud-testing
     * I do not know whether the transcodings returned for a SoundCloud Go+
     * account would include high-quality ('hq') ones and if so, their protocols
     * and mimeTypes - not to mention the format of the actual streaming URLs
     * obtained from these transcodings. First step would be to dump all
     * transcodings to log so I can inspect them...
     */
    if (sc.getConfigValue('logTranscodings')) {
      sc.getLogger().info(`[soundcloud-testing] Transcodings for ${track.id} - ${track.title}`);
      sc.getLogger().info(JSON.stringify(track.transcodings));
    }

    const longStreamFormat = sc.getConfigValue('longStreamFormat');
    const isLongStream = track.playableState === 'allowed' && track.duration && (track.duration / 1000) > 1800;

    let transcodingUrl = null;
    /**
     * Primary filter is 'protocol' + 'quality'.
     * Secondary filter is 'format', which is an array of strings to match, in order of preference, against a transcoding's mimeType.
     * 'format' is optional - we return from primary filter results even if no match.
     */
    let preferred;
    if (isLongStream) {
      const format = longStreamFormat === LongStreamFormat.Opus ? [ 'ogg', 'mpeg' ] : [ 'mpeg', 'ogg' ];
      preferred = [
        { protocol: 'hls', format, quality: 'sq' },
        /**
         * Progressive stream URLs have a ridiculously short expiry period (around 30 minutes),
         * so playback of longer streams will end prematurely with 403 Forbidden error.
         */
        { protocol: 'progressive', format: [ 'mpeg' ], quality: 'sq' }
      ];
    }
    else {
      preferred = [
        //{ protocol: 'progressive', format: [ 'mp4' ], quality: 'hq' },
        //{ protocol: 'hls', format: [ 'mp4' ], quality: 'hq' },
        { protocol: 'progressive', format: [ 'mpeg' ], quality: 'sq' },
        // Despite having higher bitrates, 'hls' + 'mpeg' streams have seeking problems. So 'ogg' preferred.
        { protocol: 'hls', format: [ 'ogg', 'mpeg' ], quality: 'sq' }
      ];
    }
    while (transcodingUrl === null && preferred.length > 0) {
      const p = preferred.shift();
      if (p) {
        const primary = track.transcodings.filter(
          (t) => t.protocol === p.protocol && t.quality === p.quality);
        if (primary.length > 0) {
          let secondary;
          for (const format of p.format) {
            const secondaryFiltered = primary.filter((t) => t.mimeType && t.mimeType.includes(format));
            if (secondaryFiltered.length > 0) {
              secondary = secondaryFiltered[0];
              break;
            }
          }
          if (!secondary) {
            secondary = primary[0];
          }
          transcodingUrl = secondary.url || null;

          if (sc.getConfigValue('logTranscodings')) {
            sc.getLogger().info(`[soundcloud-testing] Chosen transcoding: ${JSON.stringify(secondary)}`);
          }
        }
      }
    }
    return transcodingUrl;
  }
}
