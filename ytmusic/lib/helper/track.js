'use strict';

class TrackHelper {
  static parseTrackForExplode(track) {
    return {
      'service': 'ytmusic',
      'uri': this._getTrackUri(track),
      'albumart': track.albumart,
      'artist': track.artist,
      'album': track.album,
      'name': track.title,
      'title': track.title
    };
  }

  /**
   * Track uri:
   * ytmusic/video@videoId={...}@playlistId={...}@explodeTrackData={...}@autoplayContext={...}
   */
  static _getTrackUri(track) {
    const parts = [
      'ytmusic/video',
      `videoId=${encodeURIComponent(track.videoId)}`,
      // explodeTrackData - necessary because Volumio adds track uri in 
      // its own playlist / favorites / Last 100, and explodes them again when
      // played.
      `explodeTrackData=${encodeURIComponent(JSON.stringify(track))}`
    ];
    if (track.playlistId) {
      parts.push(`playlistId=${encodeURIComponent(track.playlistId)}`);
    }
    if (track.autoplayContext) {
      parts.push(`autoplayContext=${encodeURIComponent(JSON.stringify(track.autoplayContext))}`);
    }
    return parts.join('@');
  }
}

module.exports = TrackHelper;
