const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');

class TrackHelper {

    static cacheTracks(tracks, cacheKeyGen) {
        let cache = sc.getCache();
        tracks.forEach( (track) => {
            let keyData = { trackId: track.id };
            let key = cacheKeyGen('track', keyData);
            cache.put(key, track);
        });
    }

    static getPreferredTranscoding(track) {
        let transcodingUrl = null;
        let preferred = [
            {protocol: 'progressive', mimeType: 'audio/mpeg'},
            {protocol: 'hls', mimeType: 'audio/ogg; codecs="opus"'},
            {protocol: 'hls', mimeType: 'audio/mpeg'} // this one will probably not play well, but leaving it here anyway
        ];
        while (transcodingUrl === null && preferred.length) {
            let p = preferred.shift();
            let s = track.transcodings.find( t => t.protocol === p.protocol && t.mimeType === p.mimeType);
            if (s) {
                transcodingUrl = s.url;
            }
        }
        return transcodingUrl;
    }
}

module.exports = TrackHelper;