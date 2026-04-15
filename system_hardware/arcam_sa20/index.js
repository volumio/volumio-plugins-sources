'use strict';

const libQ = require('kew');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const io = require('socket.io-client');
const conf = new (require('v-conf'))();

const CONFIG_FILE = path.join(__dirname, 'config.json');
const SOURCE_CODES = {
  'Phono': 0x01,
  'AUX': 0x02,
  'PVR': 0x03,
  'AV': 0x04,
  'STB': 0x05,
  'CD': 0x06,
  'BD': 0x07,
  'SAT': 0x08
};
const SOURCE_NAMES = {
  0x01: 'Phono',
  0x02: 'AUX',
  0x03: 'PVR',
  0x04: 'AV',
  0x05: 'STB',
  0x06: 'CD',
  0x07: 'BD',
  0x08: 'SAT'
};
const DAC_FILTER_CODES = {
  'Linear Phase Fast Roll Off': 0x00,
  'Linear Phase Slow Roll Off': 0x01,
  'Minimum Phase Fast Roll Off': 0x02,
  'Minimum Phase Slow Roll Off': 0x03,
  'Brick Wall': 0x04,
  'Corrected Phase Fast Roll Off': 0x05,
  'Apodizing': 0x06
};
const DAC_FILTER_NAMES = {
  0x00: 'Linear Phase Fast Roll Off',
  0x01: 'Linear Phase Slow Roll Off',
  0x02: 'Minimum Phase Fast Roll Off',
  0x03: 'Minimum Phase Slow Roll Off',
  0x04: 'Brick Wall',
  0x05: 'Corrected Phase Fast Roll Off',
  0x06: 'Apodizing'
};
const AMP_IO_PRIORITY = {
  LOW: 10,
  NORMAL: 50,
  HIGH: 100
};
const STATUS_POLL_INTERVAL_MS = 500;
const STATUS_POLL_EXTENDED_EVERY = 8;
const STATUS_QUERY_RETRY_COOLDOWN_MS = 30000;
const BALANCE_DISPLAY_RESTORE_DELAY_MS = 250;

module.exports = ArcamSa20Plugin;

function ArcamSa20Plugin(context) {
  this.context = context;
  this.commandRouter = context.coreCommand;
  this.logger = context.logger;
  this.configManager = context.configManager;
  this.socket = null;
  this.prevPlaybackStatus = null;
  this.didAutoPowerOnForCurrentPlay = false;
  this.liveStatusTimer = null;
  this.liveStatusBusy = false;
  this.lastPublishedVolume = null;
  this.lastPublishedMute = null;
  this.currentPlaybackStatus = null;
  this.playAutomationRunning = false;
  this.cachedVolume = 30;
  this.cachedMute = false;
  this.idlePowerOffTimer = null;
  this.ampUnavailableStopTimer = null;
  this.nativeVolumeSettings = null;
  this.ampStatusPollFailureCount = 0;
  this.lastAmpAvailabilityReason = 'startup';
  this.unsupportedStatusQueries = {
    power: false,
    volume: false,
    balance: false,
    mute: false
  };
  this.statusQueryRetryAt = {
    power: 0,
    volume: 0,
    balance: 0,
    mute: 0
  };
  this.ampSocket = null;
  this.ampSocketPending = null;
  this.ampSocketBuffer = Buffer.alloc(0);
  this.ampSocketConnectPromise = null;
  this.ampSocketCommand = null;
  this.ampIoPending = [];
  this.ampIoActive = false;
  this.ampIoSeq = 0;
  this.liveStatusSequence = 0;
  this.lastPushedStatusSummary = null;
  this.manualApplyRunning = false;
  this.userCommandRunning = false;
  this.startupRetryTimers = [];
}

ArcamSa20Plugin.prototype.onVolumioStart = function() {
  return libQ.resolve();
};

ArcamSa20Plugin.prototype.getConfigurationFiles = function() {
  return ['config.json'];
};

ArcamSa20Plugin.prototype.onStart = function() {
  const defer = libQ.defer();
  try {
    conf.loadFile(CONFIG_FILE);
    this._clearStartupRetryTimers();
    this.cachedVolume = this._clampInt(conf.get('lastVolume'), 0, 99, this._clampInt(conf.get('playVolume'), 0, 99, 30));
    this.cachedMute = conf.get('lastMute') === 'Muted';
    this._activateSocketIO();
    this._ensureConfiguredHost()
      .fail(() => libQ.resolve())
      .then(() => {
        this._ensureDefaultPresetStored();
        return this.initVolumeSettings();
      })
      .then(() => this.queryStatusSilent())
      .then(() => {
        this._scheduleStartupRetryTimers();
        this._startLiveStatusTimer();
        this._log('started');
        defer.resolve();
      })
      .fail((err) => {
        this._log('start warning: ' + err.message);
        defer.resolve();
      });
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
};

ArcamSa20Plugin.prototype.onStop = function() {
  this._clearStartupRetryTimers();
  this._cancelIdlePowerOffTimer();
  this._stopLiveStatusTimer();
  this._destroyAmpSocket(true);
  if (this.socket) {
    try {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    } catch (e) {
      // ignore
    }
    this.socket = null;
  }
  return this.resetVolumeSettings();
};

ArcamSa20Plugin.prototype._scheduleStartupRetryTimers = function() {
  this._clearStartupRetryTimers();
  [4000, 12000, 25000].forEach((delayMs) => {
    const timer = setTimeout(() => {
      this.initVolumeSettings().fail(() => libQ.resolve());
    }, delayMs);
    this.startupRetryTimers.push(timer);
  });
};

ArcamSa20Plugin.prototype._clearStartupRetryTimers = function() {
  (this.startupRetryTimers || []).forEach((timer) => {
    clearTimeout(timer);
  });
  this.startupRetryTimers = [];
};

ArcamSa20Plugin.prototype.onRestart = function() {
  return libQ.resolve();
};

ArcamSa20Plugin.prototype.getUIConfig = function() {
  const defer = libQ.defer();
  const langCode = this.commandRouter.sharedVars.get('language_code');

  this.commandRouter.i18nJson(
    path.join(__dirname, 'i18n', 'strings_' + langCode + '.json'),
    path.join(__dirname, 'i18n', 'strings_en.json'),
    path.join(__dirname, 'UIConfig.json')
  ).then((uiconf) => {
    this._setUIValue(uiconf, 'host', conf.get('host'));
    this._setUIValue(uiconf, 'port', conf.get('port'));
    this._setUIValue(uiconf, 'timeoutMs', conf.get('timeoutMs'));

    this._setUIValue(uiconf, 'autoPowerOnPlay', conf.get('autoPowerOnPlay'));
    this._setUIValue(uiconf, 'switchSourceOnPlay', conf.get('switchSourceOnPlay'));
    this._setUIValue(uiconf, 'playSource', conf.get('playSource'));
    this._setUIValue(uiconf, 'setVolumeOnPlay', conf.get('setVolumeOnPlay'));
    this._setUIValue(uiconf, 'playVolumeValue', conf.get('playVolume'));
    this._setUIValue(uiconf, 'dacFilterValue', this._normalizeDacFilterSelection(conf.get('lastDacFilter'), conf.get('dacFilter') || 'Apodizing'));
    this._setUIValue(uiconf, 'powerOnDelayMs', conf.get('powerOnDelayMs'));
    this._setUIValue(uiconf, 'autoPowerOffOnIdle', conf.get('autoPowerOffOnIdle'));
    this._setUIValue(uiconf, 'stopPlaybackWhenAmpUnavailable', !!conf.get('stopPlaybackWhenAmpUnavailable'));
    this._setUIValue(uiconf, 'idlePowerOffDelaySec', conf.get('idlePowerOffDelaySec'));
    this._setUIValue(uiconf, 'debugLogging', conf.get('debugLogging'));

    const manualSource = this._normalizeSourceSelection(conf.get('lastSource'), this._normalizeSourceSelection(conf.get('manualSource'), conf.get('playSource') || 'CD'));
    const manualBalance = this._balanceStringToInt(conf.get('lastBalance'));
    this._setUIValue(uiconf, 'manualSource', manualSource);
    this._setUIValue(uiconf, 'manualBalanceValue', manualBalance);

    this._setUIValue(uiconf, 'connectionState', this._getConnectionStateText());
    this._setUIValue(uiconf, 'statusSummary', conf.get('statusSummary'));
    defer.resolve(uiconf);
  }).fail((err) => defer.reject(err));

  return defer.promise;
};

ArcamSa20Plugin.prototype.saveConnectionConfig = function(data) {
  const manualHost = String(data.host || '').trim();
  conf.set('host', manualHost);
  conf.set('port', this._clampInt(data.port, 1, 65535, 50000));
  conf.set('timeoutMs', this._clampInt(data.timeoutMs, 500, 20000, 3000));
  this._destroyAmpSocket(true);
  setTimeout(() => {
    this.initVolumeSettings().fail(() => libQ.resolve());
  }, 500);
  if (manualHost) {
    this._toast('success', 'ARCAM SA20', 'Connection settings saved');
    return libQ.resolve();
  }
  return this._discoverSa20HostInternal({
    silent: false,
    pushUiRefresh: true
  });
};

ArcamSa20Plugin.prototype.saveBehaviorConfig = function(data) {
  const requestedDacFilter = this._normalizeDacFilterSelection(data.dacFilterValue, conf.get('dacFilter') || 'Apodizing');
  const previousDacFilter = this._normalizeDacFilterSelection(conf.get('dacFilter'), 'Apodizing');

  conf.set('autoPowerOnPlay', !!data.autoPowerOnPlay);
  conf.set('switchSourceOnPlay', !!data.switchSourceOnPlay);
  conf.set('playSource', this._normalizeSourceSelection(data.playSource, conf.get('playSource') || 'CD'));
  conf.set('setVolumeOnPlay', !!data.setVolumeOnPlay);
  conf.set('playVolume', this._readClampedUiInt(data, ['playVolumeValue', 'playVolumeSlider', 'playVolume'], 0, 99, 30));
  conf.set('dacFilter', requestedDacFilter);
  conf.set('powerOnDelayMs', this._clampInt(data.powerOnDelayMs, 0, 15000, 3500));
  conf.set('autoPowerOffOnIdle', !!data.autoPowerOffOnIdle);
  conf.set('stopPlaybackWhenAmpUnavailable', !!data.stopPlaybackWhenAmpUnavailable);
  conf.set('idlePowerOffDelaySec', this._clampInt(data.idlePowerOffDelaySec, 1, 86400, 900));
  conf.set('debugLogging', !!data.debugLogging);
  if (!conf.get('stopPlaybackWhenAmpUnavailable')) {
    this._clearAmpUnavailableState('feature disabled');
  }
  setTimeout(() => {
    this.initVolumeSettings().fail(() => libQ.resolve());
  }, 500);
  return libQ.resolve()
    .then(() => {
      if (requestedDacFilter === previousDacFilter) {
        return libQ.resolve();
      }
      return this._setDacFilter(requestedDacFilter)
        .then(() => this.queryStatusSilent().fail(() => libQ.resolve()));
    })
    .then(() => {
      this._toast('success', 'ARCAM SA20', 'Playback automation settings saved');
    })
    .fail((err) => {
      this._toast('warning', 'ARCAM SA20', 'Playback settings saved, but DAC filter update failed: ' + err.message);
    });
};

ArcamSa20Plugin.prototype.resetDefaultPreset = function() {
  const defaults = this._readDefaultPreset();
  const keysToReset = [
    'host',
    'port',
    'timeoutMs',
    'autoPowerOnPlay',
    'switchSourceOnPlay',
    'playSource',
    'manualSource',
    'setVolumeOnPlay',
    'playVolume',
    'dacFilter',
    'manualBalance',
    'powerOnDelayMs',
    'debugLogging',
    'autoPowerOffOnIdle',
    'stopPlaybackWhenAmpUnavailable',
    'idlePowerOffDelaySec'
  ];

  keysToReset.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      conf.set(key, defaults[key]);
    }
  });

  conf.set('lastPower', 'Unknown');
  conf.set('lastSource', 'Unknown');
  conf.set('lastMute', 'Unknown');
  conf.set('lastBalance', String(Object.prototype.hasOwnProperty.call(defaults, 'manualBalance') ? defaults.manualBalance : 0));
  conf.set('lastDacFilter', 'Unknown');
  this.cachedVolume = this._clampInt(defaults.playVolume, 0, 99, 30);
  this.cachedMute = false;
  this.unsupportedStatusQueries = {
    power: false,
    volume: false,
    balance: false,
    mute: false
  };
  this.statusQueryRetryAt = {
    power: 0,
    volume: 0,
    balance: 0,
    mute: 0
  };
  this._clearAmpUnavailableState('default preset restored');
  this._destroyAmpSocket(true);
  this.initVolumeSettings().fail(() => libQ.resolve());

  return this._refreshStatusStrict(true)
    .then(() => this._pushUiConfigRefresh().fail(() => libQ.resolve()))
    .then(() => {
      this._toast('success', 'ARCAM SA20', 'Default preset restored');
    })
    .fail((err) => {
      this._pushUiConfigRefresh().fail(() => libQ.resolve());
      this._toast('warning', 'ARCAM SA20', 'Default preset restored, but status refresh failed: ' + err.message);
    });
};

ArcamSa20Plugin.prototype.setDefaultPreset = function() {
  const preset = this._captureCurrentPreset();
  conf.set('defaultPresetJson', JSON.stringify(preset));
  conf.set('defaultPresetInitialized', true);
  this._toast('success', 'ARCAM SA20', 'Current values stored as default preset');
  return libQ.resolve();
};

ArcamSa20Plugin.prototype.setManualSource = function(data) {
  const source = this._normalizeSourceSelection(this._readUiValue(data, ['source', 'manualSource']), conf.get('manualSource') || conf.get('playSource') || 'CD');
  const balanceValue = this._readUiValue(data, ['manualBalanceValue', 'manualBalance']);
  const hasBalance = typeof balanceValue !== 'undefined';
  const confirmedSource = this._normalizeSourceSelection(conf.get('lastSource'), conf.get('manualSource') || conf.get('playSource') || 'CD');
  const confirmedBalanceRaw = conf.get('lastBalance') || 'Unknown';
  const confirmedBalanceKnown = confirmedBalanceRaw !== 'Unknown';
  const confirmedBalance = this._balanceStringToInt(confirmedBalanceRaw);
  const requestedBalance = hasBalance ? this._clampInt(balanceValue, -12, 12, 0) : null;
  const sourceChanged = source !== confirmedSource;
  const balanceChanged = hasBalance && confirmedBalanceKnown && requestedBalance !== confirmedBalance;

  return this._applyManualState({
    source: sourceChanged ? source : null,
    balance: balanceChanged ? requestedBalance : null,
    successMessage: sourceChanged && balanceChanged ? 'Source / balance sent to SA20' :
      (sourceChanged ? 'Source sent to SA20' :
        (balanceChanged ? 'Balance sent to SA20' : 'No confirmed change to send'))
  });
};

ArcamSa20Plugin.prototype.setManualBalance = function(data) {
  const balance = this._readClampedUiInt(data, ['manualBalanceValue', 'manualBalance'], -12, 12, 0);
  return this._applyManualState({
    balance: balance
  });
};

ArcamSa20Plugin.prototype.testConnection = function() {
  return this._ensureConfiguredHost()
    .then(() => this._connectOnly())
    .then(() => {
      this._toast('success', 'ARCAM SA20', 'TCP connection successful to ' + conf.get('host'));
    })
    .fail((err) => {
      this._toast('error', 'ARCAM SA20', 'TCP connection failed: ' + err.message);
      throw err;
    });
};

ArcamSa20Plugin.prototype.discoverSa20Host = function() {
  return this._discoverSa20HostInternal({
    silent: false,
    pushUiRefresh: true
  });
};

ArcamSa20Plugin.prototype._ensureConfiguredHost = function() {
  if (String(conf.get('host') || '').trim()) {
    return libQ.resolve(conf.get('host'));
  }
  return this._discoverSa20HostInternal({
    silent: true,
    pushUiRefresh: false
  });
};

ArcamSa20Plugin.prototype._discoverSa20HostInternal = function(options) {
  const settings = options || {};
  const ports = this._getDiscoveryPorts();
  const timeoutMs = this._clampInt(conf.get('timeoutMs'), 500, 20000, 3000);
  const scanTimeoutMs = this._clampInt(Math.min(timeoutMs, 1200), 200, 5000, 700);
  const targets = this._getDiscoveryTargets();

  if (!targets.length) {
    const err = new Error('no local IPv4 subnet found for discovery');
    if (!settings.silent) {
      this._toast('error', 'ARCAM SA20', 'Automatic discovery failed: ' + err.message);
    }
    return libQ.reject(err);
  }

  this._destroyAmpSocket(true);
  this._log('starting SA20 discovery on ' + targets.length + ' candidate hosts and ports ' + ports.join(', '));

  return this._scanHostsForSa20(targets, ports, scanTimeoutMs)
    .then((match) => {
      if (!match) {
        throw new Error('no SA20 responding on TCP ports ' + ports.join(', '));
      }
      conf.set('host', match.host);
      conf.set('port', match.port);
      this.unsupportedStatusQueries = {
        power: false,
        volume: false,
        balance: false,
        mute: false
      };
      this.statusQueryRetryAt = {
        power: 0,
        volume: 0,
        balance: 0,
        mute: 0
      };
      if (!settings.silent) {
        this._toast('success', 'ARCAM SA20', 'Discovered amplifier at ' + match.host + ':' + match.port);
      }
      if (settings.pushUiRefresh) {
        return this._pushUiConfigRefresh()
          .fail(() => libQ.resolve())
          .then(() => match.host);
      }
      return match.host;
    })
    .fail((err) => {
      if (!settings.silent) {
        this._toast('error', 'ARCAM SA20', 'Automatic discovery failed: ' + err.message);
      }
      throw err;
    });
};

ArcamSa20Plugin.prototype._getDiscoveryPorts = function() {
  const configuredPort = this._clampInt(conf.get('port'), 1, 65535, 50000);
  const ports = [50000];
  if (configuredPort !== 50000) {
    ports.push(configuredPort);
  }
  return ports;
};

ArcamSa20Plugin.prototype._getDiscoveryTargets = function() {
  const interfaces = os.networkInterfaces ? os.networkInterfaces() : {};
  const seen = {};
  const targets = [];

  Object.keys(interfaces || {}).forEach((name) => {
    (interfaces[name] || []).forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }
      const address = String(entry.address || '').trim();
      const parts = address.split('.');
      if (parts.length !== 4) {
        return;
      }
      const prefix = parts.slice(0, 3).join('.');
      for (let i = 1; i <= 254; i++) {
        const host = prefix + '.' + i;
        if (host === address || seen[host]) {
          continue;
        }
        seen[host] = true;
        targets.push(host);
      }
    });
  });

  const configuredHost = String(conf.get('host') || '').trim();
  if (configuredHost && !seen[configuredHost]) {
    targets.unshift(configuredHost);
  }

  return targets;
};

ArcamSa20Plugin.prototype._scanHostsForSa20 = function(targets, ports, timeoutMs) {
  const defer = libQ.defer();
  const jobs = [];
  (ports || []).forEach((port) => {
    targets.forEach((host) => {
      jobs.push({ host: host, port: port });
    });
  });
  const maxConcurrent = this._clampInt(Math.min(24, Math.max(4, jobs.length)), 1, 64, 16);
  let cursor = 0;
  let active = 0;
  let finished = false;
  let foundMatch = null;

  const maybeFinish = () => {
    if (finished) {
      return;
    }
    if (foundMatch) {
      finished = true;
      defer.resolve(foundMatch);
      return;
    }
    if (cursor >= jobs.length && active === 0) {
      finished = true;
      defer.resolve(null);
      return;
    }
    while (active < maxConcurrent && cursor < jobs.length && !finished) {
      const job = jobs[cursor++];
      active += 1;
      this._probeSa20Host(job.host, job.port, timeoutMs)
        .then((matchedHost) => {
          if (matchedHost && !foundMatch) {
            foundMatch = {
              host: matchedHost,
              port: job.port
            };
          }
        })
        .fail(() => libQ.resolve())
        .fin(() => {
          active -= 1;
          maybeFinish();
        });
    }
  };

  maybeFinish();
  return defer.promise;
};

ArcamSa20Plugin.prototype._probeSa20Host = function(host, port, timeoutMs) {
  const defer = libQ.defer();
  const socket = net.createConnection({ host: host, port: port });
  const payload = Buffer.from([0x21, 0x01, 0x00, 0x01, 0xF0, 0x0D]);
  let buffer = Buffer.alloc(0);
  let connected = false;
  let settled = false;

  const finish = (matched) => {
    if (settled) {
      return;
    }
    settled = true;
    try {
      socket.destroy();
    } catch (e) {
      // ignore
    }
    defer.resolve(matched ? host : null);
  };

  socket.setNoDelay(true);
  socket.setTimeout(timeoutMs);

  socket.on('connect', () => {
    connected = true;
    socket.write(payload, (err) => {
      if (err) {
        finish(false);
      }
    });
  });

  socket.on('data', (chunk) => {
    if (settled) {
      return;
    }
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : Buffer.from(chunk);
    const extracted = this._extractAmpResponseFrameFromBuffer(buffer);
    buffer = extracted.rest;
    if (!extracted.frame) {
      return;
    }
    try {
      const resp = this._parseResponse(extracted.frame);
      finish(resp.zone === 0x01);
    } catch (e) {
      finish(false);
    }
  });

  socket.on('timeout', () => finish(connected));
  socket.on('error', () => finish(false));
  socket.on('close', () => finish(false));

  return defer.promise;
};

ArcamSa20Plugin.prototype.queryStatus = function() {
  return this._refreshStatusStrict(true, {
    includeBalance: true,
    preferSystemStatus: true
  })
    .then(() => {
      this._toast('success', 'ARCAM SA20', 'Amplifier status refreshed');
    })
    .fail((err) => {
      this._toast('error', 'ARCAM SA20', 'Status query failed: ' + err.message);
      throw err;
    });
};

ArcamSa20Plugin.prototype.queryStatusSilent = function(options) {
  return this._pollStatusAndReflect(true, options);
};

ArcamSa20Plugin.prototype.powerOn = function() {
  conf.set('lastPower', 'On');
  return this._sendCommandNoAck(0x00, [0x01], AMP_IO_PRIORITY.HIGH)
    .then(() => this._delay(this._clampInt(conf.get('powerOnDelayMs'), 0, 15000, 3500)))
    .then(() => this.queryStatusSilent().fail(() => libQ.resolve()));
};

ArcamSa20Plugin.prototype.powerOff = function() {
  conf.set('lastPower', 'Standby');
  return this._sendCommandNoAck(0x00, [0x00], AMP_IO_PRIORITY.HIGH)
    .then(() => this.queryStatusSilent().fail(() => libQ.resolve()));
};

ArcamSa20Plugin.prototype.muteToggle = function() {
  return this._sendCommandNoAckImmediate(0x0E, [0x02], 50)
    .then(() => this.getVolumeObject());
};

ArcamSa20Plugin.prototype.volumeUp = function() {
  return this._applyVolumeCommandNoAck(0xF1, this._clampInt(this.cachedVolume + 1, 0, 99, this.cachedVolume))
    .then(() => this.getVolumeObject());
};

ArcamSa20Plugin.prototype.volumeDown = function() {
  return this._applyVolumeCommandNoAck(0xF2, this._clampInt(this.cachedVolume - 1, 0, 99, this.cachedVolume))
    .then(() => this.getVolumeObject());
};

ArcamSa20Plugin.prototype._applyManualState = function(options) {
  const settings = options || {};
  const source = typeof settings.source === 'string' ? this._normalizeSourceSelection(settings.source, conf.get('manualSource') || conf.get('playSource') || 'CD') : null;
  const volume = typeof settings.volume === 'number' ? this._clampInt(settings.volume, 0, 99, this.cachedVolume) : null;
  const balance = typeof settings.balance === 'number' ? this._clampInt(settings.balance, -12, 12, 0) : null;
  const steps = [];
  const sourceCode = source ? SOURCE_CODES[source] : null;
  const restartLiveStatusTimer = !!this.liveStatusTimer;

  if (source) {
    conf.set('manualSource', source);
  }
  if (volume !== null) {
    conf.set('manualVolume', volume);
    this.cachedVolume = volume;
  }
  if (balance !== null) {
    conf.set('manualBalance', balance);
  }
  this._log('manual control requested: source=' + (source || '-') + ' code=' + sourceCode + ' volume=' + (volume !== null ? volume : '-') + ' balance=' + (balance !== null ? balance : '-'));
  this.manualApplyRunning = true;
  this._stopLiveStatusTimer();

  if (typeof sourceCode === 'number') {
    steps.push(() => this._sendCommandNoAck(0x1D, [sourceCode], AMP_IO_PRIORITY.NORMAL).then(() => this._delay(300)));
  }
  if (volume !== null) {
    steps.push(() => this._sendCommandNoAck(0x0D, [volume], AMP_IO_PRIORITY.NORMAL).then(() => this._delay(150)));
  }
  if (balance !== null) {
    steps.push(() => this._sendCommandNoAck(0x3B, [this._encodeBalance(balance)], AMP_IO_PRIORITY.NORMAL)
      .then(() => this._delay(150))
      .then(() => this._restoreSourceDisplayAfterBalance()));
  }

  return this._runSeries(steps)
    .then(() => this._publishVolumeToVolumioIfChanged().fail(() => libQ.resolve()))
    .then(() => this.queryStatusSilent({
      includeBalance: false,
      preferSystemStatus: false
    }).fail(() => libQ.resolve()))
    .then(() => {
      if (settings.successMessage) {
        this._toast('success', 'ARCAM SA20', settings.successMessage);
      }
    })
    .fail((err) => {
      this._toast('error', 'ARCAM SA20', 'Manual control failed: ' + err.message);
      throw err;
    })
    .fin(() => {
      this.manualApplyRunning = false;
      if (restartLiveStatusTimer) {
        setTimeout(() => {
          if (!this.manualApplyRunning) {
            this._startLiveStatusTimer();
          }
        }, 2000);
      }
    });
};

ArcamSa20Plugin.prototype.updateVolumeSettings = function() {
  return this.retrievevolume();
};

ArcamSa20Plugin.prototype.retrievevolume = function() {
  return this._queryVolume()
    .then(() => this._queryMute())
    .fail(() => libQ.resolve())
    .then(() => this.getVolumeObject());
};

ArcamSa20Plugin.prototype.volumioupdatevolume = function() {
  return this.getVolumeObject();
};

ArcamSa20Plugin.prototype.alsavolume = function(volumeRequest) {
  let promise;

  switch (volumeRequest) {
    case 'mute':
      promise = this._setMuteState(true, 'alsa mute');
      break;
    case 'unmute':
      this.idlePowerOffTimer = null;
      promise = this._setMuteState(false, 'alsa unmute');
      break;
    case 'toggle':
      promise = this._sendCommandNoAckImmediate(0x0E, [0x02], 50)
        .then(() => conf.get('lastMute'));
      break;
    case '+':
      promise = this._applyVolumeCommandNoAck(0xF1, this._clampInt(this.cachedVolume + 1, 0, 99, this.cachedVolume));
      break;
    case '-':
      promise = this._applyVolumeCommandNoAck(0xF2, this._clampInt(this.cachedVolume - 1, 0, 99, this.cachedVolume));
      break;
    default:
      const target = this._clampInt(volumeRequest, 0, 99, this.cachedVolume);
      promise = this._applyVolumeCommandNoAck(target, target);
      break;
  }

  return promise.then(() => this.getVolumeObject());
};


ArcamSa20Plugin.prototype._scheduleVolumeSync = function(delayMs) {
  const waitMs = this._clampInt(delayMs, 50, 2000, 350);
  if (this._volumeSyncTimer) {
    clearTimeout(this._volumeSyncTimer);
  }
  this._volumeSyncTimer = setTimeout(() => {
    this._volumeSyncTimer = null;
    this._queryVolume().fail(() => libQ.resolve());
  }, waitMs);
};

ArcamSa20Plugin.prototype._applyVolumeCommandNoAck = function(dataByte, nextVolume) {
  const restartLiveStatusTimer = !!this.liveStatusTimer;
  const resolvedVolume = this._clampInt(nextVolume, 0, 99, this.cachedVolume);

  this.cachedVolume = resolvedVolume;
  conf.set('lastVolume', this.cachedVolume);
  this.userCommandRunning = true;
  this._stopLiveStatusTimer();

  return this._sendCommandNoAckImmediate(0x0D, [dataByte], 150)
    .then(() => this._publishVolumeToVolumioIfChanged().fail(() => libQ.resolve()))
    .fin(() => {
      this.userCommandRunning = false;
      if (restartLiveStatusTimer) {
        setTimeout(() => {
          if (!this.manualApplyRunning && !this.userCommandRunning) {
            this._startLiveStatusTimer();
          }
        }, 3000);
      }
    });
};

ArcamSa20Plugin.prototype._applyMuteCommandNoAck = function(dataByte, targetMuted) {
  const restartLiveStatusTimer = !!this.liveStatusTimer;
  this.userCommandRunning = true;
  this._stopLiveStatusTimer();

  return this._sendCommandNoAckImmediate(0x0E, [dataByte], 150)
    .fin(() => {
      this.userCommandRunning = false;
      if (restartLiveStatusTimer) {
        setTimeout(() => {
          if (!this.manualApplyRunning && !this.userCommandRunning) {
            this._startLiveStatusTimer();
          }
        }, 3000);
      }
    });
};

ArcamSa20Plugin.prototype.getVolumeObject = function() {
  return libQ.resolve({
    vol: this._clampInt(this.cachedVolume, 0, 99, 30),
    mute: this._getConfirmedMuteForDisplay(),
    currentDisableVolumeControl: false
  });
};

ArcamSa20Plugin.prototype._getAlsaConfigParam = function(key, fallbackValue) {
  try {
    const value = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', key);
    return typeof value === 'undefined' || value === null ? fallbackValue : value;
  } catch (e) {
    return fallbackValue;
  }
};

ArcamSa20Plugin.prototype._readNativeVolumeSettings = function() {
  const device = this._getAlsaConfigParam('outputdevice', '');
  if (!device) {
    return null;
  }

  return {
    device: device,
    devicename: this._getAlsaConfigParam('devicename', ''),
    mixer: this._getAlsaConfigParam('mixer', ''),
    mixertype: this._getAlsaConfigParam('mixertype', this._getAlsaConfigParam('mixer_type', 'hardware')),
    maxvolume: this._clampInt(this._getAlsaConfigParam('maxvolume', this._getAlsaConfigParam('max_volume', 100)), 1, 100, 100),
    volumecurve: this._getAlsaConfigParam('volumecurve', 'logarithmic'),
    volumesteps: this._clampInt(this._getAlsaConfigParam('volumesteps', 1), 1, 20, 1)
  };
};

ArcamSa20Plugin.prototype.initVolumeSettings = function() {
  const nativeSettings = this._readNativeVolumeSettings();
  if (!nativeSettings) {
    this.logger.warn('[arcam_sa20] skipping volume override because no ALSA outputdevice is configured');
    return libQ.resolve();
  }

  this.nativeVolumeSettings = nativeSettings;
  const volSettingsData = {
    pluginType: 'system_hardware',
    pluginName: 'arcam_sa20',
    volumeOverride: true,
    device: nativeSettings.device,
    devicename: 'ARCAM SA20',
    mixer: nativeSettings.mixer,
    mixertype: nativeSettings.mixertype,
    maxvolume: 99,
    volumecurve: nativeSettings.volumecurve,
    volumesteps: nativeSettings.volumesteps,
    currentmute: !!this.cachedMute,
    name: 'ARCAM SA20'
  };

  return this.commandRouter.volumioUpdateVolumeSettings(volSettingsData);
};

ArcamSa20Plugin.prototype.resetVolumeSettings = function() {
  const nativeSettings = this.nativeVolumeSettings || this._readNativeVolumeSettings();
  if (!nativeSettings) {
    return libQ.resolve();
  }

  const volSettingsData = Object.assign({}, nativeSettings, {
    volumeOverride: false,
    currentmute: false
  });

  return this.commandRouter.volumioUpdateVolumeSettings(volSettingsData)
    .fail(() => libQ.resolve());
};

ArcamSa20Plugin.prototype._activateSocketIO = function() {
  this.socket = io.connect('http://localhost:3000');
  this.socket.emit('getState');

  this.socket.on('pushState', (data) => {
    const current = data && data.status ? data.status : null;
    const previous = this.prevPlaybackStatus;

    this.currentPlaybackStatus = current;

    if ((previous === null || previous === 'stop' || previous === 'pause') && current === 'play') {
      this._cancelIdlePowerOffTimer();
      this._handlePlayTransition();
    } else {
      this._handlePlaybackStateForIdlePowerOff(current);
    }

    this.prevPlaybackStatus = current;
  });
};

ArcamSa20Plugin.prototype._cancelIdlePowerOffTimer = function() {
  if (this.idlePowerOffTimer) {
    clearTimeout(this.idlePowerOffTimer);
    this.idlePowerOffTimer = null;
  }
};

ArcamSa20Plugin.prototype._handlePlaybackStateForIdlePowerOff = function(status) {
  this.currentPlaybackStatus = status;
  if (status === 'play') {
    this._cancelIdlePowerOffTimer();
    return;
  }
  this._cancelAmpUnavailableStopTimer();
  if (status === 'pause' || status === 'stop' || status === null) {
    this._armIdlePowerOffTimer();
  }
};

ArcamSa20Plugin.prototype._armIdlePowerOffTimer = function() {
  this._cancelIdlePowerOffTimer();

  if (!conf.get('autoPowerOffOnIdle')) {
    return;
  }

  const delayMs = this._clampInt(conf.get('idlePowerOffDelaySec'), 1, 86400, 900) * 1000;

  this.idlePowerOffTimer = setTimeout(() => {
    this._maybePowerOffForIdle();
  }, delayMs);
};

ArcamSa20Plugin.prototype._maybePowerOffForIdle = function() {
  this.idlePowerOffTimer = null;

  if (!conf.get('autoPowerOffOnIdle')) {
    return;
  }

  if (this.currentPlaybackStatus === 'play') {
    return;
  }

  const targetSource = this._normalizeSourceSelection(conf.get('playSource'), 'CD');

  this._queryPower()
    .then((power) => {
      if (power !== 'On') {
        return libQ.reject(new Error('amplifier not on'));
      }
      return this._querySource();
    })
    .then((source) => {
      if (source !== targetSource) {
        return libQ.reject(new Error('source is not playback source'));
      }
      conf.set('lastPower', 'Standby');
      return this._sendCommandNoAck(0x00, [0x00], AMP_IO_PRIORITY.NORMAL)
        .then(() => this.queryStatusSilent());
    })
    .then(() => {
      this._log('idle auto-standby executed');
    })
    .fail((err) => {
      this._log('idle auto-standby skipped: ' + err.message);
    });
};

ArcamSa20Plugin.prototype._handlePlayTransition = function() {
  if (this.playAutomationRunning) {
    return;
  }

  this.playAutomationRunning = true;

  this._preparePlaybackAutomation()
    .then(() => {
      return this.queryStatusSilent().fail((err) => {
        this._log('post-play status refresh failed: ' + err.message);
        return libQ.resolve();
      });
    })
    .fail((err) => {
      this._toast('error', 'ARCAM SA20', 'Play automation failed: ' + err.message);
      this._log('play automation failed: ' + err.message);
    })
    .fin(() => {
      this.playAutomationRunning = false;
    });
};

ArcamSa20Plugin.prototype._preparePlaybackAutomation = function() {
  return this._ensurePoweredForPlayback()
    .then(() => {
      const steps = [];

      if (this._isMutedCached()) {
        steps.push(() => this._setMuteState(false, 'playback start unmute'));
      }

      if (conf.get('switchSourceOnPlay')) {
        steps.push(() => this._setPlaybackSource());
      }

      if (conf.get('setVolumeOnPlay')) {
        steps.push(() => this._setPlaybackVolume());
      }

      return this._runSeries(steps);
    })
    .then((result) => {
      this.didAutoPowerOnForCurrentPlay = false;
  this.liveStatusTimer = null;
  this.liveStatusBusy = false;
      return result;
    })
    .fail((err) => {
      this.didAutoPowerOnForCurrentPlay = false;
  this.liveStatusTimer = null;
  this.liveStatusBusy = false;
      return libQ.reject(err);
    });
};

ArcamSa20Plugin.prototype._issuePlaybackPowerOn = function(reason) {
  this.didAutoPowerOnForCurrentPlay = true;
  conf.set('lastPower', 'On');
  this._log('attempting playback power-on (' + reason + ')');
  return this._sendCommandNoAck(0x00, [0x01], AMP_IO_PRIORITY.HIGH)
    .then(() => this._delay(this._clampInt(conf.get('powerOnDelayMs'), 0, 15000, 3500)))
    .then(() => true);
};

ArcamSa20Plugin.prototype._ensurePoweredForPlayback = function() {
  this.didAutoPowerOnForCurrentPlay = false;
  this.liveStatusTimer = null;
  this.liveStatusBusy = false;

  return this._queryPower()
    .then((power) => {
      if (power === 'On') {
        return libQ.resolve(false);
      }
      if (power === 'Unknown') {
        if (!conf.get('autoPowerOnPlay')) {
          return libQ.reject(new Error('amplifier power state is unknown and auto power on is disabled'));
        }
        return this._issuePlaybackPowerOn('power state unknown');
      }
      if (!conf.get('autoPowerOnPlay')) {
        return libQ.reject(new Error('amplifier is in standby and auto power on is disabled'));
      }
      return this._issuePlaybackPowerOn('amplifier in standby');
    })
    .fail((err) => {
      if (conf.get('autoPowerOnPlay')) {
        this._log('power query failed before playback: ' + err.message + '; attempting blind power-on');
        return this._issuePlaybackPowerOn('power query failed');
      }
      this.didAutoPowerOnForCurrentPlay = false;
  this.liveStatusTimer = null;
  this.liveStatusBusy = false;
      return libQ.reject(err);
    });
};

ArcamSa20Plugin.prototype._setPlaybackSource = function() {
  const source = this._normalizeSourceSelection(conf.get('playSource'), 'CD');
  const code = SOURCE_CODES[source];
  if (typeof code !== 'number') {
    return libQ.reject(new Error('invalid playback source'));
  }
  return this._sendCommandNoAck(0x1D, [code], AMP_IO_PRIORITY.HIGH).then(() => this._delay(150));
};

ArcamSa20Plugin.prototype._setPlaybackVolume = function() {
  const volume = this._clampInt(conf.get('playVolume'), 0, 99, 30);
  return this._sendCommandNoAck(0x0D, [volume], AMP_IO_PRIORITY.HIGH)
    .then(() => this._delay(150))
    .then(() => {
      this.cachedVolume = volume;
      conf.set('lastVolume', String(volume));
    });
};

ArcamSa20Plugin.prototype._cancelAmpUnavailableStopTimer = function() {
  if (this.ampUnavailableStopTimer) {
    clearTimeout(this.ampUnavailableStopTimer);
    this.ampUnavailableStopTimer = null;
  }
};

ArcamSa20Plugin.prototype._clearAmpUnavailableState = function(reason) {
  this.ampStatusPollFailureCount = 0;
  this.lastAmpAvailabilityReason = reason || 'available';
  this._cancelAmpUnavailableStopTimer();
};

ArcamSa20Plugin.prototype._stopPlaybackForAmpUnavailable = function() {
  this.ampUnavailableStopTimer = null;

  if (this.currentPlaybackStatus !== 'play') {
    return libQ.resolve();
  }

  const stopViaSocket = () => {
    try {
      if (this.socket) {
        this.socket.emit('stop');
      }
    } catch (e) {
      // ignore
    }
    return libQ.resolve();
  };

  try {
    if (this.commandRouter && typeof this.commandRouter.volumioStop === 'function') {
      const maybe = this.commandRouter.volumioStop();
      return libQ.resolve(maybe).fail(() => stopViaSocket()).then(() => {
        this._log('playback stopped after amplifier was unavailable for 5 minutes (' + this.lastAmpAvailabilityReason + ')');
      });
    }
  } catch (e) {
    return stopViaSocket().then(() => {
      this._log('playback stopped after amplifier was unavailable for 5 minutes (' + this.lastAmpAvailabilityReason + ')');
    });
  }

  return stopViaSocket().then(() => {
    this._log('playback stopped after amplifier was unavailable for 5 minutes (' + this.lastAmpAvailabilityReason + ')');
  });
};

ArcamSa20Plugin.prototype._armAmpUnavailableStopTimer = function(reason) {
  if (!conf.get('stopPlaybackWhenAmpUnavailable')) {
    this._cancelAmpUnavailableStopTimer();
    return;
  }
  if (this.currentPlaybackStatus !== 'play') {
    return;
  }
  this.lastAmpAvailabilityReason = reason || 'amplifier unavailable';
  if (this.ampUnavailableStopTimer) {
    return;
  }

  this.ampUnavailableStopTimer = setTimeout(() => {
    this._stopPlaybackForAmpUnavailable();
  }, 300000);

  this._log('amplifier unavailable while playing; stop timer armed for 300 seconds (' + this.lastAmpAvailabilityReason + ')');
};

ArcamSa20Plugin.prototype._getPlaybackTargetSource = function() {
  return this._normalizeSourceSelection(conf.get('playSource'), 'CD');
};

ArcamSa20Plugin.prototype._evaluateAmpAvailability = function(power, source) {
  const normalizedPower = typeof power === 'string' ? power : 'Unknown';
  const normalizedSource = typeof source === 'string' ? source : 'Unknown';
  const targetSource = this._getPlaybackTargetSource();

  if (normalizedPower === 'On') {
    return {
      available: true,
      confirmedUnavailable: false,
      reason: normalizedSource !== 'Unknown' ? ('power on, source ' + normalizedSource) : 'power on'
    };
  }

  if (normalizedPower === 'Standby') {
    return {
      available: false,
      confirmedUnavailable: true,
      reason: normalizedSource !== 'Unknown' ? ('power standby, source ' + normalizedSource) : 'power standby'
    };
  }

  if (normalizedSource !== 'Unknown' && normalizedSource === targetSource) {
    return {
      available: false,
      confirmedUnavailable: false,
      reason: 'power unknown but source matches playback source'
    };
  }

  return {
    available: false,
    confirmedUnavailable: false,
    reason: normalizedSource !== 'Unknown' ? ('power unknown, source ' + normalizedSource) : 'power unknown'
  };
};

ArcamSa20Plugin.prototype._getConnectionStateText = function() {
  const host = String(conf.get('host') || '').trim();
  if (!host) {
    return 'ERROR: SA20 host not configured';
  }
  if (this.ampStatusPollFailureCount >= 3) {
    return 'ERROR: No SA20 response from ' + host;
  }
  if ((conf.get('lastPower') || 'Unknown') === 'Unknown' && (conf.get('lastSource') || 'Unknown') === 'Unknown') {
    return 'Checking SA20 at ' + host;
  }
  return 'Connected to ' + host;
};

ArcamSa20Plugin.prototype._rebuildStatusSummaryFromCache = function() {
  const summary = [
    'PWR ' + (conf.get('lastPower') || '-'),
    'SRC ' + (conf.get('lastSource') || '-'),
    'VOL ' + (conf.get('lastVolume') !== undefined ? conf.get('lastVolume') : '-'),
    'MUTE ' + (conf.get('lastMute') || '-'),
    'BAL ' + (conf.get('lastBalance') || '-')
  ].join(' | ');
  conf.set('statusSummary', summary);
  conf.set('connectionState', this._getConnectionStateText());
  return summary;
};

ArcamSa20Plugin.prototype._pushUiConfigRefresh = function() {
  return this.commandRouter.getUIConfigOnPlugin('system_hardware', 'arcam_sa20', {})
    .then((uiconf) => {
      this.commandRouter.broadcastMessage('pushUiConfig', uiconf);
      return uiconf;
    })
    .fail(() => libQ.resolve());
};

ArcamSa20Plugin.prototype._pushStatusSummaryRefreshIfChanged = function(summary) {
  const resolvedSummary = typeof summary === 'string' ? summary : conf.get('statusSummary');
  const statusSignature = String(conf.get('connectionState') || '') + ' | ' + String(resolvedSummary || '');
  if (!resolvedSummary) {
    return libQ.resolve();
  }
  if (statusSignature === this.lastPushedStatusSummary) {
    return libQ.resolve();
  }
  this.lastPushedStatusSummary = statusSignature;
  return this._pushUiConfigRefresh();
};

ArcamSa20Plugin.prototype._publishVolumeToVolumioIfChanged = function() {
  return this.getVolumeObject().then((volumeObject) => {
    const vol = volumeObject && typeof volumeObject.vol !== 'undefined' ? volumeObject.vol : null;
    const mute = volumeObject ? !!volumeObject.mute : false;

    const changed = (vol !== this.lastPublishedVolume) || (mute !== this.lastPublishedMute);
    if (!changed) {
      return volumeObject;
    }

    this.lastPublishedVolume = vol;
    this.lastPublishedMute = mute;

    return this.commandRouter.volumioupdatevolume(volumeObject)
      .fail(() => libQ.resolve())
      .then(() => volumeObject);
  });
};

ArcamSa20Plugin.prototype._pollStatusAndReflect = function(forceFull, options) {
  if (this.manualApplyRunning || this.userCommandRunning) {
    return libQ.resolve();
  }
  if (this.liveStatusBusy) {
    return libQ.resolve();
  }

  this.liveStatusBusy = true;

  return this._queryAndCacheStatus(forceFull, options)
    .then(() => {
      this.ampStatusPollFailureCount = 0;
      const availability = this._evaluateAmpAvailability(conf.get('lastPower'), conf.get('lastSource'));
      if (availability.available || !availability.confirmedUnavailable) {
        this._clearAmpUnavailableState(availability.reason);
      } else {
        this._armAmpUnavailableStopTimer(availability.reason);
      }
    })
    .then(() => this._rebuildStatusSummaryFromCache())
    .then((summary) => this._pushStatusSummaryRefreshIfChanged(summary).then(() => summary))
    .then(() => this._publishVolumeToVolumioIfChanged())
    .fail((err) => {
      this.ampStatusPollFailureCount += 1;
      if (this.ampStatusPollFailureCount >= 3) {
        this._armAmpUnavailableStopTimer('status polling failed ' + this.ampStatusPollFailureCount + ' times');
      } else {
        this._cancelAmpUnavailableStopTimer();
      }
      conf.set('connectionState', this._getConnectionStateText());
      this._pushStatusSummaryRefreshIfChanged(conf.get('statusSummary')).fail(() => libQ.resolve());
      this._log('status poll failed: ' + err.message);
      return libQ.resolve();
    })
    .fin(() => {
      this.liveStatusBusy = false;
    });
};

ArcamSa20Plugin.prototype._refreshStatusStrict = function(forceFull, options) {
  if (this.manualApplyRunning || this.userCommandRunning || this.liveStatusBusy) {
    return libQ.reject(new Error('status refresh busy'));
  }

  this.liveStatusBusy = true;

  return this._queryAndCacheStatus(forceFull, options)
    .then(() => {
      this.ampStatusPollFailureCount = 0;
      const availability = this._evaluateAmpAvailability(conf.get('lastPower'), conf.get('lastSource'));
      if (availability.available || !availability.confirmedUnavailable) {
        this._clearAmpUnavailableState(availability.reason);
      } else {
        this._armAmpUnavailableStopTimer(availability.reason);
      }
    })
    .then(() => this._rebuildStatusSummaryFromCache())
    .then((summary) => this._pushStatusSummaryRefreshIfChanged(summary).then(() => summary))
    .then(() => this._publishVolumeToVolumioIfChanged())
    .fin(() => {
      this.liveStatusBusy = false;
    });
};

ArcamSa20Plugin.prototype._stopLiveStatusTimer = function() {
  if (this.liveStatusTimer) {
    clearInterval(this.liveStatusTimer);
    this.liveStatusTimer = null;
  }
  this.liveStatusBusy = false;
};

ArcamSa20Plugin.prototype._startLiveStatusTimer = function() {
  this._stopLiveStatusTimer();
  this.liveStatusSequence = 0;
  this._pollStatusAndReflect(true);
  this.liveStatusTimer = setInterval(() => {
    this._pollStatusAndReflect(false);
  }, STATUS_POLL_INTERVAL_MS);
};


ArcamSa20Plugin.prototype._queryAndCacheStatus = function(forceFull, options) {
  this.liveStatusSequence += 1;
  const runLegacyStatusSequence = () => {
    const steps = [
      () => this._querySource(),
      () => this._queryMute()
    ];

    steps.push(() => this._queryPower());
    steps.push(() => this._queryVolume());
    steps.push(() => this._queryBalance());
    steps.push(() => this._queryDacFilter());

    return this._runSeries(steps);
  };

  const statusPromise = this._querySystemStatus()
    .fail((err) => {
      this._log('system status query failed; falling back to individual queries: ' + err.message);
      return runLegacyStatusSequence();
    });

  return statusPromise.then(() => {
    const now = new Date();
    const ts = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    conf.set('lastStatusUpdate', ts);
    this._rebuildStatusSummaryFromCache();
  });
};

ArcamSa20Plugin.prototype._queryPower = function() {
  if (this._shouldSkipStatusQuery('power')) {
    return libQ.resolve(conf.get('lastPower') || 'Unknown');
  }
  return this._sendStatusQuery(0x00, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    this._clearStatusQuerySuppression('power');
    if (resp.answerCode !== 0x00) {
      conf.set('lastPower', 'Unknown');
      return 'Unknown';
    }
    const parsed = this._parsePower(resp);
    conf.set('lastPower', parsed);
    return parsed;
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._markStatusQueryTimeout('power');
      this._log('power status query timed out; falling back to last confirmed power state');
      conf.set('lastPower', 'Unknown');
      return conf.get('lastPower') || 'Unknown';
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._queryVolume = function() {
  if (this._shouldSkipStatusQuery('volume')) {
    return libQ.resolve(String(conf.get('lastVolume') !== undefined ? conf.get('lastVolume') : this.cachedVolume));
  }
  return this._sendCommand(0x0D, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    this._clearStatusQuerySuppression('volume');
    const parsed = this._parseVolume(resp);
    conf.set('lastVolume', parsed);
    this.cachedVolume = this._clampInt(parsed, 0, 99, this.cachedVolume);
    return parsed;
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._markStatusQueryTimeout('volume');
      this._log('volume status query timed out; falling back to cached volume');
      return String(conf.get('lastVolume') !== undefined ? conf.get('lastVolume') : this.cachedVolume);
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._queryMute = function() {
  if (this._shouldSkipStatusQuery('mute')) {
    return libQ.resolve(conf.get('lastMute') || 'Unknown');
  }
  return this._sendStatusQuery(0x0E, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    this._clearStatusQuerySuppression('mute');
    if (resp.answerCode !== 0x00) {
      conf.set('lastMute', 'Unknown');
      return 'Unknown';
    }
    const parsed = this._parseMute(resp);
    conf.set('lastMute', parsed);
    this.cachedMute = parsed === 'Muted';
    return parsed;
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._markStatusQueryTimeout('mute');
      this._log('mute status query timed out; keeping last confirmed mute state');
      return conf.get('lastMute') || 'Unknown';
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._querySource = function() {
  return this._sendStatusQuery(0x1D, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    if (resp.answerCode !== 0x00) {
      conf.set('lastSource', 'Unknown');
      return 'Unknown';
    }
    const parsed = this._parseSource(resp);
    conf.set('lastSource', parsed);
    return parsed;
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._log('source status query timed out; marking source unknown');
      conf.set('lastSource', 'Unknown');
      return 'Unknown';
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._queryBalance = function() {
  if (this._shouldSkipStatusQuery('balance')) {
    return libQ.resolve(conf.get('lastBalance') || '0');
  }
  return this._sendStatusQuery(0x3B, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    this._clearStatusQuerySuppression('balance');
    if (resp.answerCode !== 0x00) {
      conf.set('lastBalance', 'Unknown');
      return 'Unknown';
    }
    const parsed = this._parseBalance(resp);
    conf.set('lastBalance', parsed);
    conf.set('manualBalance', this._balanceStringToInt(parsed));
    return this._restoreSourceDisplayAfterBalance().fail(() => libQ.resolve()).then(() => parsed);
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._markStatusQueryTimeout('balance');
      this._log('balance status query timed out; falling back to cached balance');
      return conf.get('lastBalance') || '0';
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._queryDacFilter = function() {
  return this._sendStatusQuery(0x61, [0xF0], AMP_IO_PRIORITY.LOW).then((resp) => {
    if (resp.answerCode !== 0x00) {
      conf.set('lastDacFilter', 'Unknown');
      return 'Unknown';
    }
    const parsed = this._parseDacFilter(resp);
    conf.set('lastDacFilter', parsed);
    conf.set('dacFilter', parsed);
    return parsed;
  }).fail((err) => {
    if (this._isTimeoutError(err)) {
      this._log('DAC filter query timed out; keeping last confirmed DAC filter');
      return conf.get('lastDacFilter') || 'Unknown';
    }
    return libQ.reject(err);
  });
};

ArcamSa20Plugin.prototype._querySystemStatus = function() {
  return this._queueAmpIo(() => this._querySystemStatusRaw(), AMP_IO_PRIORITY.LOW)
    .then((frames) => this._applySystemStatusFrames(frames));
};

ArcamSa20Plugin.prototype._querySystemStatusRaw = function() {
  const frames = [];
  return this._runAmpSocketCommand(0x5D, [0xF0], {
    expectResponse: true,
    allowNonZeroAnswer: true,
    onFrame: (resp, commandState) => {
      frames.push(resp);
      if (resp.command !== 0x5D) {
        return;
      }
      if (resp.answerCode !== 0x00) {
        commandState.reject(new Error('system status returned answer code 0x' + ('0' + resp.answerCode.toString(16)).slice(-2)));
        return;
      }
      commandState.resolve(frames.slice(0));
    }
  });
};

ArcamSa20Plugin.prototype._applySystemStatusFrames = function(frames) {
  const responses = Array.isArray(frames) ? frames : [];
  let recognized = 0;

  responses.forEach((resp) => {
    if (!resp || typeof resp.command !== 'number') {
      return;
    }
    switch (resp.command) {
      case 0x00:
        this._setConfigIfChanged('lastPower', resp.answerCode === 0x00 ? this._parsePower(resp) : 'Unknown');
        this._clearStatusQuerySuppression('power');
        recognized += 1;
        break;
      case 0x0D:
        if (resp.answerCode === 0x00) {
          const parsedVolume = this._parseVolume(resp);
          this._setConfigIfChanged('lastVolume', parsedVolume);
          this.cachedVolume = this._clampInt(parsedVolume, 0, 99, this.cachedVolume);
        } else {
          this._setConfigIfChanged('lastVolume', 'Unknown');
        }
        this._clearStatusQuerySuppression('volume');
        recognized += 1;
        break;
      case 0x0E:
        if (resp.answerCode === 0x00) {
          const parsedMute = this._parseMute(resp);
          this._setConfigIfChanged('lastMute', parsedMute);
          this.cachedMute = parsedMute === 'Muted';
        } else {
          this._setConfigIfChanged('lastMute', 'Unknown');
        }
        this._clearStatusQuerySuppression('mute');
        recognized += 1;
        break;
      case 0x1D:
        this._setConfigIfChanged('lastSource', resp.answerCode === 0x00 ? this._parseSource(resp) : 'Unknown');
        recognized += 1;
        break;
      case 0x3B:
        if (resp.answerCode === 0x00) {
          const parsedBalance = this._parseBalance(resp);
          this._setConfigIfChanged('lastBalance', parsedBalance);
          this._setConfigIfChanged('manualBalance', this._balanceStringToInt(parsedBalance));
        } else {
          this._setConfigIfChanged('lastBalance', 'Unknown');
        }
        this._clearStatusQuerySuppression('balance');
        recognized += 1;
        break;
      case 0x61:
        if (resp.answerCode === 0x00) {
          const parsedDacFilter = this._parseDacFilter(resp);
          this._setConfigIfChanged('lastDacFilter', parsedDacFilter);
          this._setConfigIfChanged('dacFilter', parsedDacFilter);
        } else {
          this._setConfigIfChanged('lastDacFilter', 'Unknown');
        }
        recognized += 1;
        break;
      default:
        break;
    }
  });

  if (!recognized) {
    return libQ.reject(new Error('system status returned no recognized status frames'));
  }

  return libQ.resolve(responses);
};

ArcamSa20Plugin.prototype._queueAmpIo = function(task, priority) {
  const defer = libQ.defer();
  this.ampIoPending.push({
    task: task,
    priority: this._clampInt(priority, AMP_IO_PRIORITY.LOW, AMP_IO_PRIORITY.HIGH, AMP_IO_PRIORITY.NORMAL),
    seq: this.ampIoSeq++,
    defer: defer
  });
  this.ampIoPending.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.seq - b.seq;
  });
  this._pumpAmpIoQueue();
  return defer.promise;
};

ArcamSa20Plugin.prototype._pumpAmpIoQueue = function() {
  if (this.ampIoActive || !this.ampIoPending.length) {
    return;
  }

  const next = this.ampIoPending.shift();
  this.ampIoActive = true;

  libQ.resolve()
    .then(() => next.task())
    .then((result) => {
      next.defer.resolve(result);
    })
    .fail((err) => {
      next.defer.reject(err);
    })
    .fin(() => {
      this.ampIoActive = false;
      this._pumpAmpIoQueue();
    });
};

ArcamSa20Plugin.prototype._isMutedCached = function() {
  return this.cachedMute || conf.get('lastMute') === 'Muted';
};

ArcamSa20Plugin.prototype._getConfirmedMuteForDisplay = function() {
  if (conf.get('lastMute') === 'Muted') {
    return true;
  }
  if (conf.get('lastMute') === 'Unmuted') {
    return false;
  }
  return this.lastPublishedMute === null ? false : this.lastPublishedMute;
};

ArcamSa20Plugin.prototype._setMuteState = function(muted, reason) {
  return this._applyMuteCommandNoAck(muted ? 0x00 : 0x01, !!muted)
    .then(() => conf.get('lastMute'));
};

ArcamSa20Plugin.prototype._destroyAmpSocket = function(silent, reason) {
  const currentCommand = this.ampSocketCommand;
  const activeSocket = this.ampSocket;
  const pendingSocket = this.ampSocketPending;
  const disconnectError = silent ? null : new Error(reason || 'socket closed');

  this.ampSocket = null;
  this.ampSocketPending = null;
  this.ampSocketBuffer = Buffer.alloc(0);
  this.ampSocketConnectPromise = null;
  this.ampSocketCommand = null;

  if (currentCommand && currentCommand.timer) {
    clearTimeout(currentCommand.timer);
  }
  if (currentCommand && !silent) {
    currentCommand.reject(disconnectError);
  }

  [activeSocket, pendingSocket].forEach((socket) => {
    if (!socket) {
      return;
    }
    try {
      socket.removeAllListeners();
    } catch (e) {
      // ignore
    }
    try {
      socket.destroy();
    } catch (e) {
      // ignore
    }
  });
};

ArcamSa20Plugin.prototype._handleAmpSocketDisconnect = function(socket, err) {
  if (socket !== this.ampSocket && socket !== this.ampSocketPending) {
    return;
  }
  this._destroyAmpSocket(false, err && err.message ? err.message : 'socket closed');
};

ArcamSa20Plugin.prototype._extractAmpResponseFrameFromBuffer = function(buffer) {
  let working = buffer && buffer.length ? buffer : Buffer.alloc(0);
  if (!working.length) {
    return {
      frame: null,
      rest: Buffer.alloc(0)
    };
  }

  const startIndex = working.indexOf(0x21);
  if (startIndex === -1) {
    return {
      frame: null,
      rest: Buffer.alloc(0)
    };
  }
  if (startIndex > 0) {
    working = working.slice(startIndex);
  }
  if (working.length < 6) {
    return {
      frame: null,
      rest: working
    };
  }

  const declaredLength = working[4];
  const frameLength = 6 + declaredLength;
  if (working.length < frameLength) {
    return {
      frame: null,
      rest: working
    };
  }
  if (working[frameLength - 1] !== 0x0D) {
    return this._extractAmpResponseFrameFromBuffer(working.slice(1));
  }

  return {
    frame: working.slice(0, frameLength),
    rest: working.slice(frameLength)
  };
};

ArcamSa20Plugin.prototype._tryExtractAmpResponseFrame = function() {
  const extracted = this._extractAmpResponseFrameFromBuffer(this.ampSocketBuffer);
  this.ampSocketBuffer = extracted.rest;
  return extracted.frame;
};

ArcamSa20Plugin.prototype._handleAmpSocketData = function(chunk) {
  if (!this.ampSocketCommand || !this.ampSocketCommand.expectResponse) {
    return;
  }

  this.ampSocketBuffer = this.ampSocketBuffer.length ? Buffer.concat([this.ampSocketBuffer, chunk]) : Buffer.from(chunk);
  while (this.ampSocketCommand && this.ampSocketCommand.expectResponse) {
    const frame = this._tryExtractAmpResponseFrame();
    if (!frame) {
      return;
    }

    const currentCommand = this.ampSocketCommand;
    try {
      const resp = this._parseResponse(frame);
      if (currentCommand.onFrame) {
        currentCommand.onFrame(resp, currentCommand);
        continue;
      }
      if (resp.answerCode !== 0x00 && !currentCommand.allowNonZeroAnswer) {
        throw new Error('amplifier returned answer code 0x' + ('0' + resp.answerCode.toString(16)).slice(-2));
      }
      currentCommand.resolve(resp);
    } catch (e) {
      currentCommand.reject(e);
      this._destroyAmpSocket(true);
      return;
    }
  }
};

ArcamSa20Plugin.prototype._ensureAmpSocket = function() {
  if (this.ampSocket && !this.ampSocket.destroyed) {
    return libQ.resolve(this.ampSocket);
  }
  if (this.ampSocketConnectPromise) {
    return this.ampSocketConnectPromise;
  }

  const defer = libQ.defer();
  const socket = net.createConnection({
    host: conf.get('host'),
    port: this._clampInt(conf.get('port'), 1, 65535, 50000)
  });
  const timeoutMs = this._clampInt(conf.get('timeoutMs'), 500, 20000, 3000);
  let settled = false;
  const connectTimer = setTimeout(() => {
    failConnect(new Error('timeout'));
  }, timeoutMs);

  const failConnect = (err) => {
    if (settled) {
      return;
    }
    settled = true;
    clearTimeout(connectTimer);
    if (this.ampSocketPending === socket) {
      this.ampSocketPending = null;
    }
    if (this.ampSocketConnectPromise === defer.promise) {
      this.ampSocketConnectPromise = null;
    }
    try {
      socket.destroy();
    } catch (e) {
      // ignore
    }
    defer.reject(err);
  };

  socket.setNoDelay(true);
  this.ampSocketPending = socket;

  socket.on('connect', () => {
    if (settled) {
      return;
    }
    settled = true;
    clearTimeout(connectTimer);
    this.ampSocket = socket;
    this.ampSocketPending = null;
    this.ampSocketBuffer = Buffer.alloc(0);
    if (this.ampSocketConnectPromise === defer.promise) {
      this.ampSocketConnectPromise = null;
    }
    defer.resolve(socket);
  });

  socket.on('data', (chunk) => {
    if (socket === this.ampSocket) {
      this._handleAmpSocketData(chunk);
    }
  });

  socket.on('error', (err) => {
    if (!settled) {
      failConnect(err);
      return;
    }
    this._handleAmpSocketDisconnect(socket, err);
  });

  socket.on('close', () => {
    if (!settled) {
      failConnect(new Error('socket closed'));
      return;
    }
    this._handleAmpSocketDisconnect(socket, new Error('socket closed'));
  });

  socket.on('end', () => {
    if (settled) {
      this._handleAmpSocketDisconnect(socket, new Error('socket ended'));
    }
  });

  this.ampSocketConnectPromise = defer.promise;
  return defer.promise;
};

ArcamSa20Plugin.prototype._runAmpSocketCommand = function(command, dataBytes, options) {
  const settings = options || {};
  const expectResponse = !!settings.expectResponse;
  const allowNonZeroAnswer = !!settings.allowNonZeroAnswer;
  const postWriteDelayMs = this._clampInt(settings.postWriteDelayMs, 0, 1000, 0);
  const onFrame = typeof settings.onFrame === 'function' ? settings.onFrame : null;
  const timeoutMs = this._clampInt(conf.get('timeoutMs'), 500, 20000, 3000);
  const payload = Buffer.from([0x21, 0x01, command, dataBytes.length].concat(dataBytes).concat([0x0D]));

  return this._ensureAmpSocket().then((socket) => {
    const defer = libQ.defer();
    let settled = false;
    const commandState = {
      expectResponse: expectResponse,
      allowNonZeroAnswer: allowNonZeroAnswer,
      onFrame: onFrame,
      timer: null,
      resolve: (value) => {
        if (settled) {
          return;
        }
        settled = true;
        if (commandState.timer) {
          clearTimeout(commandState.timer);
        }
        if (this.ampSocketCommand === commandState) {
          this.ampSocketCommand = null;
        }
        defer.resolve(value);
      },
      reject: (err) => {
        if (settled) {
          return;
        }
        settled = true;
        if (commandState.timer) {
          clearTimeout(commandState.timer);
        }
        if (this.ampSocketCommand === commandState) {
          this.ampSocketCommand = null;
        }
        defer.reject(err);
      }
    };

    if (this.ampSocketCommand) {
      return libQ.reject(new Error('amp command already active'));
    }

    this.ampSocketCommand = commandState;
    if (expectResponse) {
      this.ampSocketBuffer = Buffer.alloc(0);
    }

    commandState.timer = setTimeout(() => {
      commandState.reject(new Error('timeout'));
      this._destroyAmpSocket(true);
    }, timeoutMs);

    socket.write(payload, (err) => {
      if (err) {
        commandState.reject(err);
        this._destroyAmpSocket(true);
        return;
      }
      if (expectResponse) {
        return;
      }
      setTimeout(() => {
        commandState.resolve({
          zone: 0x01,
          command: command,
          answerCode: 0x00,
          declaredLength: dataBytes.length,
          data: dataBytes.slice(0),
          rawHex: payload.toString('hex')
        });
      }, postWriteDelayMs);
    });

    return defer.promise;
  });
};

ArcamSa20Plugin.prototype._connectOnly = function() {
  return this._queueAmpIo(() => this._connectOnlyRaw(), AMP_IO_PRIORITY.NORMAL);
};

ArcamSa20Plugin.prototype._connectOnlyRaw = function() {
  return this._ensureAmpSocket().then(() => libQ.resolve());
};

ArcamSa20Plugin.prototype._sendCommandNoAck = function(command, dataBytes, priority) {
  return this._queueAmpIo(() => this._sendCommandNoAckRaw(command, dataBytes), priority);
};

ArcamSa20Plugin.prototype._sendCommandNoAckImmediate = function(command, dataBytes, holdMs) {
  return this._queueAmpIo(() => this._sendCommandNoAckRaw(command, dataBytes, holdMs), AMP_IO_PRIORITY.HIGH);
};

ArcamSa20Plugin.prototype._sendCommandNoAckRaw = function(command, dataBytes, holdMs) {
  return this._runAmpSocketCommand(command, dataBytes, {
    expectResponse: false,
    postWriteDelayMs: holdMs
  });
};

ArcamSa20Plugin.prototype._sendCommand = function(command, dataBytes, priority) {
  return this._queueAmpIo(() => this._sendCommandRaw(command, dataBytes), priority);
};

ArcamSa20Plugin.prototype._sendStatusQuery = function(command, dataBytes, priority) {
  return this._queueAmpIo(() => this._sendStatusQueryRaw(command, dataBytes), priority);
};

ArcamSa20Plugin.prototype._sendCommandRaw = function(command, dataBytes) {
  return this._runAmpSocketCommand(command, dataBytes, {
    expectResponse: true
  });
};

ArcamSa20Plugin.prototype._sendStatusQueryRaw = function(command, dataBytes) {
  return this._runAmpSocketCommand(command, dataBytes, {
    expectResponse: true,
    allowNonZeroAnswer: true
  });
};

ArcamSa20Plugin.prototype._parseResponse = function(buffer) {
  if (!buffer || buffer.length < 6) {
    throw new Error('incomplete response');
  }
  if (buffer[0] !== 0x21) {
    throw new Error('invalid start byte');
  }
  if (buffer[buffer.length - 1] !== 0x0D) {
    throw new Error('invalid end byte');
  }

  const declaredLength = buffer[4];
  const expectedLength = 6 + declaredLength;
  if (buffer.length !== expectedLength) {
    throw new Error('response length mismatch');
  }
  return {
    zone: buffer[1],
    command: buffer[2],
    answerCode: buffer[3],
    declaredLength: declaredLength,
    data: Array.from(buffer.slice(5, -1)),
    rawHex: Array.from(buffer).map((b) => ('0' + b.toString(16)).slice(-2).toUpperCase()).join(' ')
  };
};

ArcamSa20Plugin.prototype._isTimeoutError = function(err) {
  return !!(err && err.message === 'timeout');
};

ArcamSa20Plugin.prototype._parsePower = function(resp) {
  if (!resp.data.length) return 'Unknown';
  if (resp.data[0] === 0x01) return 'On';
  if (resp.data[0] === 0x00) return 'Standby';
  return 'Unknown';
};

ArcamSa20Plugin.prototype._parseVolume = function(resp) {
  if (!resp.data.length) return 'Unknown';
  return String(resp.data[0]);
};

ArcamSa20Plugin.prototype._parseMute = function(resp) {
  if (!resp.data.length) return 'Unknown';
  if (resp.data[0] === 0x00) return 'Muted';
  if (resp.data[0] === 0x01) return 'Unmuted';
  return 'Unknown';
};

ArcamSa20Plugin.prototype._parseSource = function(resp) {
  if (!resp.data.length) return 'Unknown';
  const sourceCode = resp.data[0] & 0x0F;
  return SOURCE_NAMES[sourceCode] || 'Unknown';
};

ArcamSa20Plugin.prototype._parseBalance = function(resp) {
  if (!resp.data.length) return 'Unknown';
  const value = resp.data[0];
  if (value === 0x00) return '0';
  if (value >= 0x01 && value <= 0x0C) return '+' + String(value);
  if (value >= 0x81 && value <= 0x8C) return '-' + String(value - 0x80);
  return 'Unknown';
};

ArcamSa20Plugin.prototype._parseDacFilter = function(resp) {
  if (!resp.data.length) return 'Unknown';
  return DAC_FILTER_NAMES[resp.data[0]] || 'Unknown';
};

ArcamSa20Plugin.prototype._encodeBalance = function(value) {
  if (value === 0) return 0x00;
  if (value > 0) return value;
  return 0x80 + Math.abs(value);
};

ArcamSa20Plugin.prototype._balanceStringToInt = function(value) {
  if (typeof value !== 'string') return 0;
  if (value === '0') return 0;
  if (value.startsWith('+')) return this._clampInt(value.substring(1), 0, 12, 0);
  if (value.startsWith('-')) return -this._clampInt(value.substring(1), 0, 12, 0);
  return 0;
};

ArcamSa20Plugin.prototype._normalizeSourceSelection = function(value, fallback) {
  if (value && typeof value === 'object' && value.value) {
    value = value.value;
  }
  if (value && typeof value === 'object' && value.label) {
    value = value.label;
  }
  const candidate = String(value || fallback || 'CD');
  return Object.prototype.hasOwnProperty.call(SOURCE_CODES, candidate) ? candidate : fallback;
};

ArcamSa20Plugin.prototype._normalizeDacFilterSelection = function(value, fallback) {
  if (value && typeof value === 'object' && value.value) {
    value = value.value;
  }
  if (value && typeof value === 'object' && value.label) {
    value = value.label;
  }
  const fallbackName = Object.prototype.hasOwnProperty.call(DAC_FILTER_CODES, fallback) ? fallback : 'Apodizing';
  const candidate = String(value || fallbackName);
  return Object.prototype.hasOwnProperty.call(DAC_FILTER_CODES, candidate) ? candidate : fallbackName;
};

ArcamSa20Plugin.prototype._setDacFilter = function(filterName) {
  const normalized = this._normalizeDacFilterSelection(filterName, conf.get('dacFilter') || 'Apodizing');
  const code = DAC_FILTER_CODES[normalized];
  if (typeof code !== 'number') {
    return libQ.reject(new Error('invalid DAC filter'));
  }
  return this._sendCommandNoAck(0x61, [code], AMP_IO_PRIORITY.NORMAL)
    .then(() => this._delay(150))
    .then(() => normalized);
};

ArcamSa20Plugin.prototype._restoreSourceDisplayAfterBalance = function() {
  const source = this._normalizeSourceSelection(
    conf.get('lastSource'),
    this._normalizeSourceSelection(conf.get('manualSource'), conf.get('playSource') || 'CD')
  );
  const sourceCode = SOURCE_CODES[source];
  if (typeof sourceCode !== 'number') {
    return libQ.resolve();
  }
  return this._delay(BALANCE_DISPLAY_RESTORE_DELAY_MS)
    .then(() => this._sendCommandNoAck(0x1D, [sourceCode], AMP_IO_PRIORITY.NORMAL))
    .then(() => this._delay(150));
};

ArcamSa20Plugin.prototype._readDefaultPreset = function() {
  const storedPresetJson = String(conf.get('defaultPresetJson') || '').trim();
  if (storedPresetJson) {
    try {
      return JSON.parse(storedPresetJson);
    } catch (e) {
      // fall through to file defaults
    }
  }

  const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const defaults = {};

  Object.keys(raw || {}).forEach((key) => {
    if (raw[key] && typeof raw[key] === 'object' && Object.prototype.hasOwnProperty.call(raw[key], 'value')) {
      defaults[key] = raw[key].value;
    }
  });

  return defaults;
};

ArcamSa20Plugin.prototype._captureCurrentPreset = function() {
  const preset = {};
  [
    'host',
    'port',
    'timeoutMs',
    'autoPowerOnPlay',
    'switchSourceOnPlay',
    'playSource',
    'manualSource',
    'setVolumeOnPlay',
    'playVolume',
    'dacFilter',
    'manualBalance',
    'powerOnDelayMs',
    'debugLogging',
    'autoPowerOffOnIdle',
    'stopPlaybackWhenAmpUnavailable',
    'idlePowerOffDelaySec'
  ].forEach((key) => {
    preset[key] = conf.get(key);
  });
  return preset;
};

ArcamSa20Plugin.prototype._ensureDefaultPresetStored = function() {
  if (conf.get('defaultPresetInitialized') && String(conf.get('defaultPresetJson') || '').trim()) {
    return;
  }

  const preset = this._captureCurrentPreset();
  conf.set('defaultPresetJson', JSON.stringify(preset));
  conf.set('defaultPresetInitialized', true);
};

ArcamSa20Plugin.prototype._markStatusQueryTimeout = function(key) {
  this.unsupportedStatusQueries[key] = true;
  this.statusQueryRetryAt[key] = Date.now() + STATUS_QUERY_RETRY_COOLDOWN_MS;
};

ArcamSa20Plugin.prototype._clearStatusQuerySuppression = function(key) {
  this.unsupportedStatusQueries[key] = false;
  this.statusQueryRetryAt[key] = 0;
};

ArcamSa20Plugin.prototype._shouldSkipStatusQuery = function(key) {
  if (!this.unsupportedStatusQueries[key]) {
    return false;
  }
  if (Date.now() >= (this.statusQueryRetryAt[key] || 0)) {
    this._clearStatusQuerySuppression(key);
    return false;
  }
  return true;
};

ArcamSa20Plugin.prototype._setUIValue = function(uiconf, id, value) {
  if (!uiconf || !uiconf.sections) return;
  uiconf.sections.forEach((section) => {
    if (!section.content) return;
    section.content.forEach((item) => {
      if (item.id !== id) return;
      if (item.element === 'select') {
        item.value = { value: value, label: value };
      } else {
        item.value = value;
      }
    });
  });
};

ArcamSa20Plugin.prototype._setConfigIfChanged = function(key, value) {
  const currentValue = conf.get(key);
  if (currentValue === value) {
    return false;
  }
  conf.set(key, value);
  return true;
};

ArcamSa20Plugin.prototype._runSeries = function(tasks) {
  return tasks.reduce((promise, task) => promise.then(() => task()), libQ.resolve());
};

ArcamSa20Plugin.prototype._delay = function(ms) {
  const defer = libQ.defer();
  setTimeout(() => defer.resolve(), ms);
  return defer.promise;
};

ArcamSa20Plugin.prototype._clampInt = function(value, min, max, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

ArcamSa20Plugin.prototype._readUiValue = function(data, keys) {
  const source = data && typeof data === 'object' ? data : {};
  for (let i = 0; i < keys.length; i++) {
    const value = source[keys[i]];
    if (typeof value !== 'undefined' && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

ArcamSa20Plugin.prototype._readClampedUiInt = function(data, keys, min, max, fallback) {
  return this._clampInt(this._readUiValue(data, keys), min, max, fallback);
};

ArcamSa20Plugin.prototype._toast = function(type, title, message) {
  try {
    this.commandRouter.pushToastMessage(type, title, message);
  } catch (e) {
    this._log(title + ': ' + message);
  }
};

ArcamSa20Plugin.prototype._log = function(message) {
  if (conf.get('debugLogging')) {
    this.logger.info('[arcam_sa20] ' + message);
  }
};
