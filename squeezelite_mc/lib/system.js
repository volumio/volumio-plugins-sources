const fs = require("fs");
const exec = require('child_process').exec;
const path = require('path');
const sm = require(squeezeliteMCPluginLibRoot + '/sm');

const DSD_FORMAT_TO_SQUEEZELITE_OPT = {
  'dop': 'dop',
  'DSD_U8': 'u8',
  'DSD_U16_LE': 'u16le',
  'DSD_U16_BE': 'u16be',
  'DSD_U32_LE': 'u32le',
  'DSD_U32_BE': 'u32be'
};

const SYSTEMD_TEMPLATE_FILE = path.resolve(__dirname) + '/../templates/systemd/squeezelite.service.template';
const SYSTEMD_SERVICE_FILE = '/etc/systemd/system/squeezelite.service';
const ALSA_CONF_TEMPLATE_FILE = path.resolve(__dirname) + '/../templates/alsa/100-squeezelite.conf.template';
const ALSA_CONF_FILE = '/etc/alsa/conf.d/100-squeezelite.conf';
const SQUEEZELITE_LOG_FILE = '/tmp/squeezelite.log';

const ERR_DEVICE_BUSY = -1;

function execCommand(cmd, sudo = false) {
  return new Promise((resolve, reject) => {
    sm.getLogger().info(`[squeezelite_mc] Executing ${cmd}`);
    exec(sudo ? `echo volumio | sudo -S ${cmd}` : cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to execute ${cmd}: ${stderr.toString()}`, error));
        reject(error);
      } else {
        resolve(stdout.toString());
      }
    });
  })
}

function systemctl(cmd, service = '') {
  const fullCmd = `/usr/bin/sudo /bin/systemctl ${cmd} ${service} || true`;
  return execCommand(fullCmd);
};

async function getSqueezeliteServiceStatus() {
  const recognizedStatuses = ['inactive', 'active', 'activating', 'failed'];
  const regex = /Active: (.*) \(.*\)/gm;
  const out = await systemctl('status', 'squeezelite');
  const matches = [...out.matchAll(regex)];
  if (matches[0] && matches[0][1] && recognizedStatuses.includes(matches[0][1])) {
    return matches[0][1];
  }
  else {
    return 'inactive';
  }
}

async function restartSqueezeliteService() {
  const status = await getSqueezeliteServiceStatus();
  const stopPromise = status === 'active' ? stopSqueezeliteService() : Promise.resolve();
  await stopPromise;
  const rmLogPromise = fs.existsSync(SQUEEZELITE_LOG_FILE) ? execCommand(`rm ${SQUEEZELITE_LOG_FILE}`, true) : Promise.resolve();
  await rmLogPromise;
  await systemctl('start', 'squeezelite');
  try {
    await resolveOnSqueezeliteServiceStatusMatch('active', 5);
  } catch (error) {
    // Look for recognizable error in log file
    const throwErr = new Error();
    if (fs.existsSync(SQUEEZELITE_LOG_FILE)) {
      const log = fs.readFileSync(SQUEEZELITE_LOG_FILE).toString();
      if (log.indexOf('Device or resource busy') >= 0) {
        throwErr.reason = ERR_DEVICE_BUSY;
      }
    }
    throw throwErr;
  }
}

function resolveOnSqueezeliteServiceStatusMatch(status, matchConsecutive = 1, retries = 5) {
  let consecutiveCount = 0;
  let tryCount = 0;

  const startCheckTimer = (resolve, reject) => {
    setTimeout(async () => {
      const _status = await getSqueezeliteServiceStatus();
      if (Array.isArray(status) ? status.includes(_status) : _status === status) {
        consecutiveCount++;
        if (consecutiveCount === matchConsecutive) {
          resolve();
        }
        else {
          startCheckTimer(resolve, reject);  
        }
      }
      else if (_status === 'failed') {
        reject();
      }
      else if (_status === 'activating') {
        consecutiveCount = 0;
        startCheckTimer(resolve, reject);
      }
      else if (tryCount < retries - 1) {
        consecutiveCount = 0;
        tryCount++;
        startCheckTimer(resolve, reject);
      }
      else {
        reject();
      }
    }, 500);
  }


  return new Promise((resolve, reject) => {
    startCheckTimer(resolve, reject);
  });
}

async function updateSqueezeliteService(config) {
  const template = fs.readFileSync(SYSTEMD_TEMPLATE_FILE).toString();
  const hasPlayerName = config.playerName && config.playerName.length > 0;
  const hasMixer = config.mixer && config.mixer.length > 0;
  const hasDsdFormat = config.dsdFormat && DSD_FORMAT_TO_SQUEEZELITE_OPT[config.dsdFormat];
  const out = template
    .replace('${PLAYER_NAME_OPT}', hasPlayerName ? `-n ${config.playerName}` : '')
    .replace('${VOLUME_CONTROL_OPT}', hasMixer ? `-V ${config.mixer}` : '')
    .replace('${DSD_OPT}', hasDsdFormat ? `-D 3:${DSD_FORMAT_TO_SQUEEZELITE_OPT[config.dsdFormat]}` : '')
    .replace('${LOG_FILE}', SQUEEZELITE_LOG_FILE);
  fs.writeFileSync(`${SYSTEMD_TEMPLATE_FILE}.out`, out);
  const cpCmd = `cp ${SYSTEMD_TEMPLATE_FILE}.out ${SYSTEMD_SERVICE_FILE}`
  await execCommand(cpCmd, true);
  return true;
}

async function updateAlsaConf(config) {
  const template = fs.readFileSync(ALSA_CONF_TEMPLATE_FILE).toString();
  const out = template.replace('${CARD}', config.card);
  fs.writeFileSync(`${ALSA_CONF_TEMPLATE_FILE}.out`, out);
  const cpCmd = `cp ${ALSA_CONF_TEMPLATE_FILE}.out ${ALSA_CONF_FILE}`
  await execCommand(cpCmd, true);
  return true;
}

async function initSqueezeliteService(config) {
  await updateAlsaConf(config);
  await updateSqueezeliteService(config);
  await systemctl('daemon-reload');
  return restartSqueezeliteService();
}

async function stopSqueezeliteService() {
  await systemctl('stop', 'squeezelite');
  return resolveOnSqueezeliteServiceStatusMatch(['inactive', 'failed']);
}

async function getAlsaFormats(card) {
  //const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 | sed -e '1,/Available formats:/d' | awk -F'-' '{print $2}' | awk '{$1=$1}1'`;
  const regExFormatsList = /Available formats:\n(.*)/gms;
  const regExFormats = /^- (.*)/gm;
  const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 || true`;
  const output = await execCommand(cmd);
  if (output.indexOf('Device or resource busy') >= 0) {
    sm.getLogger().error(`[squeezelite_mc] Could not query supported ALSA formats for card ${card} because device is busy`);
    const err = new Error();
    err.reason = ERR_DEVICE_BUSY;
    throw err;
  }
  else {
    const formatsListMatches = [...output.matchAll(regExFormatsList)];
    const formatsList = formatsListMatches[0] && formatsListMatches[0][1] ? formatsListMatches[0][1] : null;
    if (formatsList) {
      const formatsMatches = [...formatsList.matchAll(regExFormats)];
      const formats = formatsMatches.map((match) => (match[1] || '').trim());
      sm.getLogger().info(`[squeezelite_mc] Card ${card} supports the following ALSA formats: ${JSON.stringify(formats)}`);
      return formats;
    }
    else {
      sm.getLogger().warn(`[squeezelite_mc] No supported ALSA formats found for card ${card}`);
      return [];
    }
  }
}

module.exports = {
  initSqueezeliteService,
  getSqueezeliteServiceStatus,
  stopSqueezeliteService,
  getAlsaFormats,
  ERR_DEVICE_BUSY
};
