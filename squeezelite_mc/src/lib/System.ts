import path from 'path';
import sm from './SqueezeliteMCContext';
import { exec } from 'child_process';
import * as fs from 'fs';
import { AlsaConfig, PlayerStartupParams } from './types/Player';
import { basicPlayerStartupParamsToSqueezeliteOpts } from './Util';

const SYSTEMD_TEMPLATE_FILE = `${path.resolve(__dirname)}/../templates/systemd/squeezelite.service.template`;
const SYSTEMD_SERVICE_FILE = '/etc/systemd/system/squeezelite.service';
const ALSA_CONF_TEMPLATE_FILE = `${path.resolve(__dirname)}/../templates/alsa/100-squeezelite.conf.template`;
const ALSA_CONF_FILE = '/etc/alsa/conf.d/100-squeezelite.conf';

export const SQUEEZELITE_LOG_FILE = '/tmp/squeezelite.log';

export class SystemError extends Error {
  code?: SystemErrorCode;
}

export enum SystemErrorCode {
  DeviceBusy = -1
}

function execCommand(cmd: string, sudo = false) {
  return new Promise<string>((resolve, reject) => {
    sm.getLogger().info(`[squeezelite_mc] Executing ${cmd}`);
    exec(sudo ? `echo volumio | sudo -S ${cmd}` : cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to execute ${cmd}: ${stderr.toString()}`, error));
        reject(error);
      }
      else {
        resolve(stdout.toString());
      }
    });
  });
}

function systemctl(cmd: string, service = '') {
  const fullCmd = `/usr/bin/sudo /bin/systemctl ${cmd} ${service} || true`;
  return execCommand(fullCmd);
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
  }
  catch (error) {
    // Look for recognizable error in log file
    const throwErr = new SystemError();
    if (fs.existsSync(SQUEEZELITE_LOG_FILE)) {
      const log = fs.readFileSync(SQUEEZELITE_LOG_FILE).toString();
      if (log.indexOf('Device or resource busy') >= 0) {
        throwErr.code = SystemErrorCode.DeviceBusy;
      }
    }
    throw throwErr;
  }
}

function resolveOnSqueezeliteServiceStatusMatch(status: string | string[], matchConsecutive = 1, retries = 5) {
  let consecutiveCount = 0;
  let tryCount = 0;

  const startCheckTimer = (resolve: (value?: unknown) => void, reject: () => void) => {
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
  };


  return new Promise((resolve, reject) => {
    startCheckTimer(resolve, reject);
  });
}

async function updateSqueezeliteService(params: PlayerStartupParams) {
  const startupOpts = params.type === 'basic' ? basicPlayerStartupParamsToSqueezeliteOpts(params) : params.startupOptions;
  const template = fs.readFileSync(SYSTEMD_TEMPLATE_FILE).toString();
  /* eslint-disable-next-line no-template-curly-in-string */
  const out = template.replace('${STARTUP_OPTS}', startupOpts);
  fs.writeFileSync(`${SYSTEMD_TEMPLATE_FILE}.out`, out);
  const cpCmd = `cp ${SYSTEMD_TEMPLATE_FILE}.out ${SYSTEMD_SERVICE_FILE}`;
  await execCommand(cpCmd, true);
  return true;
}

async function updateAlsaConf(conf: AlsaConfig) {
  const template = fs.readFileSync(ALSA_CONF_TEMPLATE_FILE).toString();
  let ctl: string;
  if (conf.mixerType !== 'None') {
    ctl = `
      ctl.squeezelite {
          type hw
          card ${conf.card}
      }`;
  }
  else {
    ctl = '';
  }
  // eslint-disable-next-line no-template-curly-in-string
  const out = template.replace('${CTL}', ctl);
  fs.writeFileSync(`${ALSA_CONF_TEMPLATE_FILE}.out`, out);
  const cpCmd = `cp ${ALSA_CONF_TEMPLATE_FILE}.out ${ALSA_CONF_FILE}`;
  await execCommand(cpCmd, true);
  await execCommand('alsactl -L -R nrestore', true);
  return true;
}

export async function initSqueezeliteService(params: PlayerStartupParams) {
  await updateAlsaConf(params);
  await updateSqueezeliteService(params);
  await systemctl('daemon-reload');
  return restartSqueezeliteService();
}

export async function stopSqueezeliteService() {
  await systemctl('stop', 'squeezelite');
  return resolveOnSqueezeliteServiceStatusMatch([ 'inactive', 'failed' ]);
}

export async function getSqueezeliteServiceStatus() {
  const recognizedStatuses = [ 'inactive', 'active', 'activating', 'failed' ];
  const regex = /Active: (.*) \(.*\)/gm;
  const out = await systemctl('status', 'squeezelite');
  const matches = [ ...out.matchAll(regex) ];
  if (matches[0] && matches[0][1] && recognizedStatuses.includes(matches[0][1])) {
    return matches[0][1];
  }

  return 'inactive';

}

export async function getAlsaFormats(card: string): Promise<string[]> {
  //Const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 | sed -e '1,/Available formats:/d' | awk -F'-' '{print $2}' | awk '{$1=$1}1'`;
  const regExFormatsList = /Available formats:\n(.*)/gms;
  const regExFormats = /^- (.*)/gm;
  const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 || true`;
  const output = await execCommand(cmd);
  if (output.indexOf('Device or resource busy') >= 0) {
    sm.getLogger().error(`[squeezelite_mc] Could not query supported ALSA formats for card ${card} because device is busy`);
    const err = new SystemError();
    err.code = SystemErrorCode.DeviceBusy;
    throw err;
  }
  else {
    const formatsListMatches = [ ...output.matchAll(regExFormatsList) ];
    const formatsList = formatsListMatches[0] && formatsListMatches[0][1] ? formatsListMatches[0][1] : null;
    if (formatsList) {
      const formatsMatches = [ ...formatsList.matchAll(regExFormats) ];
      const formats = formatsMatches.map((match) => (match[1] || '').trim());
      sm.getLogger().info(`[squeezelite_mc] Card ${card} supports the following ALSA formats: ${JSON.stringify(formats)}`);
      return formats;
    }

    sm.getLogger().warn(`[squeezelite_mc] No supported ALSA formats found for card ${card}`);
    return [];

  }
}
