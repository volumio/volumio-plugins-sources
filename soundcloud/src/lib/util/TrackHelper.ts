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

    let transcodingUrl = null;
    const preferred = [
      { protocol: 'progressive', mimeType: 'audio/mpeg' },
      { protocol: 'hls', mimeType: 'audio/ogg; codecs="opus"' },
      { protocol: 'hls', mimeType: 'audio/mpeg' } // This one will probably not play well, but leaving it here anyway
    ];
    while (transcodingUrl === null && preferred.length > 0) {
      const p = preferred.shift();
      if (p) {
        const s = track.transcodings.find(
          (t) => t.protocol === p.protocol && t.mimeType === p.mimeType);
        if (s) {
          transcodingUrl = s.url;
        }
      }
    }
    return transcodingUrl;
  }
}
