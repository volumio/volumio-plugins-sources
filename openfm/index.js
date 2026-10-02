'use strict';

/**
 * Open FM — Volumio 4 (Bookworm) music service plugin.
 *
 * Port of the Kodi addon plugin.audio.open_FM by pajretX.
 *
 * Streams from open.fm are token-signed: a token is fetched from
 *   https://open.fm/api/user/token?fp=<streamUrl>
 * and the returned URL (?t=...) is short-lived, so it is resolved lazily
 * at playback time via explodeUri().
 *
 * API endpoints used:
 *   - stations:   https://open.fm/api/radio/stations
 *                 -> { "<id>": { id, name, slug, streamUrl, logoUrl, ... } }
 *   - categories: embedded in __NEXT_DATA__ on https://open.fm/
 *                 (props.pageProps.fallback.categories -> [{ id, name, slug, stations }])
 */

var libQ = require('kew');
var https = require('https');
var spawn = require('child_process').spawn;
var PKG_VERSION = require('./package.json').version;

var USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
var API_STATIONS = 'https://open.fm/api/radio/stations';
var PAGE_URL = 'https://open.fm/';
var TOKEN_URL = 'https://open.fm/api/user/token?fp=';

// Emoji ranges stripped from category names (same behaviour as the Kodi addon).
var EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}\u{2900}-\u{297F}\u{FE0F}\u{200D}]+/gu;

module.exports = ControllerOpenFM;

function ControllerOpenFM(context) {
  var self = this;
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;

  this._stationsCache = null;
  this._stationsCacheTime = 0;
  this._categoriesCache = null;
  this._categoriesCacheTime = 0;

  this._metaProc = null;
  this._metaBuffer = Buffer.alloc(0);
  this._stationName = '';
  this._stationLogo = '';
  this._playUri = '';
  this._songTitle = '';
  this._songArtist = '';
  this._songArt = '';
  this._lastRawTitle = '';
  this._status = 'stop';
  this._songDuration = 0;
  this._songStartTime = 0;
  this._seekTimer = null;
  // HLS buffering delay: the timed_id3 tag is embedded at the exact song
  // boundary but MPD plays audio from a buffer, so the audible change lags
  // the tag by roughly this many ms. We shift the counter start so elapsed
  // reads ~0 when the song actually becomes audible.
  this._seekOffsetMs = 12000;
}

/* ------------------------------------------------------------------ *
 *  Volumio plugin lifecycle
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.onVolumioStart = function () {
  var self = this;
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
  return libQ.resolve();
};

ControllerOpenFM.prototype.onStart = function () {
  var self = this;
  var defer = libQ.defer();
  try {
    self.mpdPlugin = self.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
    self.addToBrowseSources();
    self.logger.info('[openfm] onStart: browse source registered');
    defer.resolve();
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    self.logger.error('[openfm] onStart failed: ' + msg);
    try {
      self.commandRouter.pushToastMessage('error', 'Open FM', 'Failed to start: ' + msg);
    } catch (e) {}
    defer.resolve();
  }
  return defer.promise;
};

ControllerOpenFM.prototype.onStop = function () {
  var self = this;
  self.logger.info('[openfm] onStop');
  self.removeToBrowseSources();
  return libQ.resolve();
};

ControllerOpenFM.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

ControllerOpenFM.prototype.getUIConfig = function () {
  var self = this;
  var defer = libQ.defer();
  var lang_code = this.commandRouter.sharedVars.get('language_code');
  self.commandRouter.i18nJson(
    __dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json'
  ).then(function (uiconf) {
    defer.resolve(uiconf);
  }).fail(function () {
    defer.reject(new Error('i18nJson failed'));
  });
  return defer.promise;
};

ControllerOpenFM.prototype.setUIConfig = function (data) {
  var self = this;
  var defer = libQ.defer();
  try {
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var val = data[key];
        if (val && typeof val === 'object' && 'value' in val) {
          val = val.value;
        }
        self.config.set(key, val);
      }
    }
    self.logger.info('[openfm] setUIConfig: config saved');
    defer.resolve();
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    self.logger.error('[openfm] setUIConfig failed: ' + msg);
    defer.reject(new Error('setUIConfig failed'));
  }
  return defer.promise;
};

ControllerOpenFM.prototype.getConf = function (varName) {
  var self = this;
  if (self.config && self.config.has && self.config.has(varName)) {
    return self.config.get(varName);
  }
  return undefined;
};

ControllerOpenFM.prototype.setConf = function (varName, varValue) {
  var self = this;
  if (self.config) {
    self.config.set(varName, varValue);
  }
};

/* ------------------------------------------------------------------ *
 *  Browse source registration
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.addToBrowseSources = function () {
  var self = this;
  var data = {
    name: 'Open FM',
    uri: 'openfm',
    plugin_type: 'music_service',
    plugin_name: 'openfm',
    albumart: '/albumart?sourceicon=music_service/openfm/icon.png&v=' + encodeURIComponent(PKG_VERSION)
  };
  self.commandRouter.volumioAddToBrowseSources(data);
};

ControllerOpenFM.prototype.removeToBrowseSources = function () {
  var self = this;
  self.commandRouter.volumioRemoveToBrowseSources('Open FM');
};

/* ------------------------------------------------------------------ *
 *  HTTP + open.fm API helpers
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.httpGet = function (url, redirects) {
  var self = this;
  var defer = libQ.defer();
  redirects = redirects || 0;
  if (redirects > 5) {
    defer.reject(new Error('too many redirects: ' + url));
    return defer.promise;
  }

  var req = https.get(url, {
    headers: { 'Accept': '*/*', 'User-Agent': USER_AGENT }
  }, function (res) {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      var next = new URL(res.headers.location, url).toString();
      self.httpGet(next, redirects + 1).then(defer.resolve).fail(defer.reject);
      return;
    }
    var data = '';
    res.on('data', function (chunk) { data += chunk; });
    res.on('end', function () {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        defer.resolve(data);
      } else {
        defer.reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
    });
  });

  req.setTimeout(15000, function () {
    req.destroy();
    defer.reject(new Error('timeout for ' + url));
  });
  req.on('error', function (err) { defer.reject(err); });
  return defer.promise;
};

ControllerOpenFM.prototype.getCacheTtlMs = function () {
  var self = this;
  var minutes = 60;
  var v = self.getConf('cache_ttl_minutes');
  if (v && Number(v) > 0) {
    minutes = Number(v);
  }
  return minutes * 60000;
};

ControllerOpenFM.prototype.getStations = function () {
  var self = this;
  var defer = libQ.defer();
  var now = Date.now();

  if (self._stationsCache && (now - self._stationsCacheTime) < self.getCacheTtlMs()) {
    defer.resolve(self._stationsCache);
    return defer.promise;
  }

  self.httpGet(API_STATIONS).then(function (body) {
    var stations = {};
    try {
      stations = JSON.parse(body);
    } catch (e) {
      self.logger.error('[openfm] failed to parse stations: ' + e);
    }
    self._stationsCache = stations;
    self._stationsCacheTime = now;
    self.logger.info('[openfm] loaded ' + Object.keys(stations).length + ' stations');
    defer.resolve(stations);
  }).fail(function (err) {
    self.logger.error('[openfm] stations fetch failed: ' + err);
    defer.reject(err);
  });
  return defer.promise;
};

ControllerOpenFM.prototype.getCategories = function () {
  var self = this;
  var defer = libQ.defer();
  var now = Date.now();

  if (self._categoriesCache && (now - self._categoriesCacheTime) < self.getCacheTtlMs()) {
    defer.resolve(self._categoriesCache);
    return defer.promise;
  }

  self.httpGet(PAGE_URL).then(function (html) {
    var cats = [];
    var m = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
    if (m) {
      try {
        var d = JSON.parse(m[1]);
        var raw = d.props.pageProps.fallback.categories;
        for (var i = 0; i < raw.length; i++) {
          var c = raw[i];
          cats.push({
            id: c.id,
            name: String(c.name).replace(EMOJI_RE, '').trim(),
            slug: c.slug,
            stations: c.stations
          });
        }
      } catch (e) {
        self.logger.error('[openfm] failed to parse categories: ' + e);
      }
    }
    self._categoriesCache = cats;
    self._categoriesCacheTime = now;
    self.logger.info('[openfm] loaded ' + cats.length + ' categories');
    defer.resolve(cats);
  }).fail(function (err) {
    self.logger.error('[openfm] categories fetch failed: ' + err);
    defer.reject(err);
  });
  return defer.promise;
};

ControllerOpenFM.prototype.resolveStreamUrl = function (streamUrl) {
  var self = this;
  var defer = libQ.defer();
  var tokenUrl = TOKEN_URL + encodeURIComponent(streamUrl);

  self.httpGet(tokenUrl).then(function (body) {
    try {
      var d = JSON.parse(body);
      if (d.url) {
        defer.resolve(d.url);
        return;
      }
    } catch (e) {
      self.logger.warn('[openfm] token parse failed: ' + e);
    }
    defer.resolve(streamUrl);
  }).fail(function (err) {
    self.logger.warn('[openfm] token fetch failed, using raw stream: ' + err);
    defer.resolve(streamUrl);
  });
  return defer.promise;
};

/* ------------------------------------------------------------------ *
 *  Browse
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.handleBrowseUri = function (curUri) {
  var self = this;
  self.logger.info('[openfm] handleBrowseUri: ' + curUri);

  if (curUri === 'openfm') {
    return self.browseRoot();
  } else if (curUri === 'openfm/all') {
    return self.browseAllStations();
  } else if (curUri.indexOf('openfm/category/') === 0) {
    return self.browseCategory(curUri.split('/')[2]);
  }
  return libQ.reject(new Error('unknown uri: ' + curUri));
};

ControllerOpenFM.prototype.browseRoot = function () {
  var self = this;
  var defer = libQ.defer();

  self.getCategories().then(function (cats) {
    var items = [{
      service: 'openfm',
      type: 'stream-category',
      title: 'Wszystkie stacje',
      artist: '',
      album: '',
      icon: 'fa fa-list',
      uri: 'openfm/all'
    }];
    for (var i = 0; i < cats.length; i++) {
      items.push({
        service: 'openfm',
        type: 'stream-category',
        title: cats[i].name,
        artist: '',
        album: '',
        icon: 'fa fa-folder-open-o',
        uri: 'openfm/category/' + cats[i].id
      });
    }
    defer.resolve({
      navigation: {
        prev: { uri: '/' },
        lists: [{
          title: 'Open FM',
          icon: 'fa-music',
          availableListViews: ['list', 'grid'],
          items: items
        }]
      }
    });
  }).fail(function (err) { defer.reject(err); });
  return defer.promise;
};

ControllerOpenFM.prototype.browseCategory = function (catId) {
  var self = this;
  var defer = libQ.defer();

  self.getCategories().then(function (cats) {
    var cat = null;
    for (var i = 0; i < cats.length; i++) {
      if (String(cats[i].id) === String(catId)) { cat = cats[i]; break; }
    }
    if (!cat) {
      defer.reject(new Error('category not found: ' + catId));
      return;
    }
    self.getStations().then(function (stations) {
      var items = [];
      for (var i = 0; i < cat.stations.length; i++) {
        var st = stations[String(cat.stations[i])];
        if (!st) continue;
        items.push(self.stationItem(st));
      }
      defer.resolve({
        navigation: {
          prev: { uri: 'openfm' },
          lists: [{
            title: cat.name,
            icon: 'fa-folder-open-o',
            availableListViews: ['list', 'grid'],
            items: items
          }]
        }
      });
    }).fail(function (err) { defer.reject(err); });
  }).fail(function (err) { defer.reject(err); });
  return defer.promise;
};

ControllerOpenFM.prototype.browseAllStations = function () {
  var self = this;
  var defer = libQ.defer();

  self.getStations().then(function (stations) {
    var arr = [];
    var ids = Object.keys(stations);
    for (var i = 0; i < ids.length; i++) {
      arr.push(stations[ids[i]]);
    }
    arr.sort(function (a, b) {
      var na = a.name || '';
      var nb = b.name || '';
      return na.localeCompare(nb);
    });
    var items = [];
    for (var j = 0; j < arr.length; j++) {
      items.push(self.stationItem(arr[j]));
    }
    defer.resolve({
      navigation: {
        prev: { uri: 'openfm' },
        lists: [{
          title: 'Wszystkie stacje',
          icon: 'fa-list',
          availableListViews: ['list', 'grid'],
          items: items
        }]
      }
    });
  }).fail(function (err) { defer.reject(err); });
  return defer.promise;
};

ControllerOpenFM.prototype.stationItem = function (st) {
  return {
    service: 'openfm',
    type: 'song',
    title: st.name,
    artist: 'Open FM',
    album: '',
    icon: 'fa fa-music',
    uri: 'openfm/station/' + st.id,
    albumart: st.logoUrl
  };
};

/* ------------------------------------------------------------------ *
 *  Explode (resolve a station to a playable, token-signed stream)
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.explodeUri = function (uri) {
  var self = this;
  var defer = libQ.defer();

  self.logger.info('[openfm] explodeUri: ' + uri);

  if (uri.indexOf('openfm/station/') !== 0) {
    defer.reject(new Error('unknown uri: ' + uri));
    return defer.promise;
  }

  var sid = uri.split('/')[2];

  self.getStations().then(function (stations) {
    var st = stations[String(sid)];
    if (!st) {
      defer.reject(new Error('station not found: ' + sid));
      return;
    }
    self.resolveStreamUrl(st.streamUrl).then(function (signedUrl) {
      self.logger.info('[openfm] ' + st.name + ' -> ' + signedUrl.slice(0, 90) + '...');
      defer.resolve({
        uri: signedUrl,
        service: 'openfm',
        name: st.name,
        artist: 'Open FM',
        album: '',
        type: 'track',
        tracknumber: 0,
        albumart: st.logoUrl,
        duration: 0,
        trackType: 'webradio'
      });
    }).fail(function (err) { defer.reject(err); });
  }).fail(function (err) { defer.reject(err); });

  return defer.promise;
};


/* ------------------------------------------------------------------ *
 *  Playback (delegate to MPD — open.fm streams are HLS, MPD plays them)
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype.clearAddPlayTrack = function (track) {
  var self = this;
  var safeUri = track.uri.replace(/"/g, '\\"');
  self.logger.info('[openfm] clearAddPlayTrack: ' + safeUri.slice(0, 90) + '...');
  self._stationName = track.name || 'Open FM';
  self._stationLogo = track.albumart || '';
  self._playUri = track.uri;
  self._songTitle = '';
  self._songArtist = '';
  self._songArt = '';
  self._lastRawTitle = '';
  self._songDuration = 0;
  self._songStartTime = 0;
  self._status = 'play';
  return self.mpdPlugin.sendMpdCommand('stop', [])
    .then(function () {
      return self.mpdPlugin.sendMpdCommand('clear', []);
    })
    .then(function () {
      // 'add' not 'load': 'load' hangs MPD on HLS (.m3u8) URLs — MPD parses
      // them as playlists and the ffmpeg input blocks the main thread,
      // so systemd's watchdog (WatchdogSec=20) SIGABRTs MPD.
      return self.mpdPlugin.sendMpdCommand('add "' + safeUri + '"', []);
    })
    .then(function () {
      return self.mpdPlugin.sendMpdCommand('play', []);
    })
    .then(function () {
      self._startMetadataReader();
      self._pushNowPlaying();
      self._startSeekTimer();
      // The core playback timer was started by play() before clearAddPlayTrack,
      // with trackBlock.duration still 0 (radio stream). It would set
      // askedForPrefetch=true (remainingTime<5000) and block our seek updates
      // in syncState, and increment currentSeek by wall-clock. Stop it so our
      // own 1s seek timer fully controls the progress display.
      try {
        self.commandRouter.stateMachine.stopPlaybackTimer();
      } catch (e) {
        self.logger.info('[openfm] stopPlaybackTimer err: ' + e);
      }
    });
};

ControllerOpenFM.prototype.stop = function () {
  var self = this;
  self.logger.info('[openfm] stop');
  self._stopMetadataReader();
  self._stopSeekTimer();
  self._status = 'stop';
  self._pushNowPlaying();
  return self.mpdPlugin.sendMpdCommand('stop', []);
};

ControllerOpenFM.prototype.pause = function () {
  var self = this;
  self.logger.info('[openfm] pause');
  self._status = 'pause';
  self._pushNowPlaying();
  return self.mpdPlugin.sendMpdCommand('pause', []);
};

ControllerOpenFM.prototype.resume = function () {
  var self = this;
  self.logger.info('[openfm] resume');
  self._status = 'play';
  self._pushNowPlaying();
  return self.mpdPlugin.sendMpdCommand('play', []);
};

ControllerOpenFM.prototype.seek = function (position) {
  var self = this;
  return self.mpdPlugin.seek(position);
};


/* ------------------------------------------------------------------ *
 *  Now-playing metadata (timed_id3 carried in the HLS stream)
 * ------------------------------------------------------------------ */

ControllerOpenFM.prototype._startMetadataReader = function () {
  var self = this;
  self._stopMetadataReader();
  if (!self._playUri) return;
  self._metaBuffer = Buffer.alloc(0);
  var args = ['-v', 'error', '-i', self._playUri, '-map', '0:0', '-f', 'data', '-'];
  var proc = spawn('ffmpeg', args);
  var errBuf = '';
  proc.stdout.on('data', function (chunk) { self._handleMetaData(chunk); });
  proc.stderr.on('data', function (d) {
    errBuf = (errBuf + d.toString()).slice(-2000);
  });
  proc.on('error', function (err) {
    self.logger.warn('[openfm] metadata ffmpeg error: ' + (err && err.message));
  });
  proc.on('exit', function (code, signal) {
    var unexpected = (self._metaProc === proc);
    if (unexpected) self._metaProc = null;
    self.logger.info('[openfm] metadata ffmpeg exited: code=' + code + ' signal=' + signal + (unexpected ? ' (unexpected)' : ' (intentional)'));
    if (unexpected && errBuf) {
      self.logger.warn('[openfm] metadata ffmpeg last stderr: ' + errBuf.slice(-500));
    }
    if (unexpected && self._status === 'play' && self._playUri) {
      setTimeout(function () { self._startMetadataReader(); }, 3000);
    }
  });
  self._metaProc = proc;
  self.logger.info('[openfm] metadata reader started');
};

ControllerOpenFM.prototype._stopMetadataReader = function () {
  var self = this;
  if (self._metaProc) {
    try { self._metaProc.kill('SIGKILL'); } catch (e) {}
    self._metaProc = null;
  }
};

ControllerOpenFM.prototype._handleMetaData = function (chunk) {
  var self = this;
  self._metaBuffer = Buffer.concat([self._metaBuffer, chunk]);
  if (self._metaBuffer.length > 65536) {
    self._metaBuffer = self._metaBuffer.slice(self._metaBuffer.length - 32768);
  }
  var changed = false;

  self._extractFrames(self._metaBuffer, 'TIT2', function (text) {
    var sep = text.lastIndexOf(' - ');
    if (sep > 0) {
      self._songArtist = text.slice(0, sep).trim();
      self._songTitle = text.slice(sep + 3).trim();
    } else {
      self._songTitle = text.trim();
      self._songArtist = '';
    }
    if (text !== self._lastRawTitle) {
      self._lastRawTitle = text;
      self._songDuration = 0;
      self._songStartTime = Date.now() + self._seekOffsetMs;
      self.logger.info('[openfm] now playing: ' + text);
      changed = true;
    }
  });
  self._extractFrames(self._metaBuffer, 'APIC', function (text) {
    var m = text.match(/https?:\/\/[^\s\u0000-\u001f]+/);
    if (m && m[0] !== self._songArt) {
      self._songArt = m[0];
      self.logger.info('[openfm] cover: ' + m[0].slice(0, 80));
      changed = true;
    }
  });
  self._extractFrames(self._metaBuffer, 'TLEN', function (text) {
    var d = parseInt(text, 10);
    if (d > 0 && d !== self._songDuration) {
      self._songDuration = d;
      self.logger.info('[openfm] duration: ' + d + 's');
      changed = true;
    }
  });

  if (changed) {
    self._pushNowPlaying();
  }
};

ControllerOpenFM.prototype._extractFrames = function (buf, frameId, cb) {
  var needle = Buffer.from(frameId);
  var i = 0;
  while ((i = buf.indexOf(needle, i)) >= 0) {
    if (i + 11 <= buf.length) {
      var size = buf.readUInt32BE(i + 4);
      if (size > 0 && size < 2048 && i + 10 + size <= buf.length) {
        var enc = buf[i + 10];
        var body = buf.slice(i + 11, i + 10 + size);
        var text = (enc === 3) ? body.toString('utf8') : body.toString('latin1');
        text = text.replace(/\u0000+$/, '').trim();
        cb(text);
      }
    }
    i += needle.length;
  }
};

ControllerOpenFM.prototype._pushNowPlaying = function () {
  var self = this;
  if (!self._playUri) return;

  // Layout: top line = "Station / Artist", second line = song title
  var name = self._songArtist
    ? (self._stationName + ' / ' + self._songArtist)
    : (self._stationName || 'Open FM');
  var artist = self._songTitle || 'Open FM';
  var art = self._songArt || self._stationLogo || '/albumart';
  var elapsed = self._songStartTime ? Math.max(0, Math.floor((Date.now() - self._songStartTime) / 1000)) : 0;
  var duration = self._songDuration || 0;

  // The UI reads trackBlock.name/artist/albumart directly (getState's else
  // branch), NOT the pushed state — syncState won't overwrite them because
  // service !== 'webradio' and the fields are already set. Update in place.
  try {
    var sm = self.commandRouter.stateMachine;
    var tb = sm.getTrack(sm.currentPosition);
    if (tb) {
      tb.name = name;
      tb.artist = artist;
      tb.albumart = art;
      tb.duration = duration;
      // Hide the technical info line ("hls 0") under the artist: Volumio
      // renders trackType + bitdepth/samplerate/bitrate there. Clear the
      // numeric fields; set trackType='webradio' so the stream is treated as
      // a (volatile) radio — the transport bar shows STOP when playing.
      tb.trackType = 'webradio';
      tb.samplerate = '';
      tb.bitdepth = '';
      tb.bitrate = '';
    }
    // Set the seek directly too, so MPD's stream-position updates (sService
    // 'mpd') can't leave a stale position on screen between our pushes.
    // NOTE: currentSeek is in MILLISECONDS (MPD pushes elapsed*1000).
    if (typeof sm.currentSeek === 'number' && elapsed >= 0) {
      sm.currentSeek = elapsed * 1000;
    }
  } catch (e) {
    self.logger.warn('[openfm] trackBlock update failed: ' + (e && e.message));
  }

  var state = {
    status: self._status,
    title: name,
    artist: artist,
    album: '',
    albumart: art,
    seek: elapsed * 1000,
    duration: duration,
    uri: self._playUri,
    service: 'openfm',
    trackType: 'webradio',
    isStreaming: true
  };
  self.commandRouter.servicePushState(state, 'openfm');
};

ControllerOpenFM.prototype._startSeekTimer = function () {
  var self = this;
  self._stopSeekTimer();
  self._seekTimer = setInterval(function () {
    // Push every second while playing, even before the first timed_id3 tag
    // arrives: the core's first 'stop -> play' transition in syncState is
    // silent (no pushState), so the transport bar would otherwise stay stuck
    // on the PLAY button until metadata arrives. Re-pushing status='play'
    // here forces the broadcast and flips the button to STOP/PAUSE.
    if (self._status === 'play') {
      self._pushNowPlaying();
    }
  }, 1000);
};

ControllerOpenFM.prototype._stopSeekTimer = function () {
  var self = this;
  if (self._seekTimer) {
    clearInterval(self._seekTimer);
    self._seekTimer = null;
  }
};
