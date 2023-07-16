import js from './JellyfinServerContext';
import xml2js from 'xml2js';
import { parseBooleans } from 'xml2js/lib/processors';
import { exec } from 'child_process';
import * as fs from 'fs';

const CONFIG_FILE = '/opt/jellyfin/config/network.xml';

function execCommand(cmd: string, sudo = false) {
  return new Promise<string>((resolve, reject) => {
    js.getLogger().info(`[jellyfin_server] Executing ${cmd}`);
    exec(sudo ? `echo volumio | sudo -S ${cmd}` : cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        js.getLogger().error(js.getErrorMessage(`[jellyfin_server] Failed to execute ${cmd}: ${stderr.toString()}`, error));
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

function resolveOnServiceStatusMatch(status: string | string[], matchConsecutive = 1, retries = 5) {
  let consecutiveCount = 0;
  let tryCount = 0;

  const startCheckTimer = (resolve: (value?: unknown) => void, reject: () => void) => {
    setTimeout(async () => {
      const _status = await getServiceStatus();
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

export async function startService() {
  await systemctl('start', 'jellyfin');
  await resolveOnServiceStatusMatch('active', 5);
}

export async function stopService() {
  await systemctl('stop', 'jellyfin');
  return resolveOnServiceStatusMatch([ 'inactive', 'failed' ]);
}

export async function getServiceStatus() {
  const recognizedStatuses = [ 'inactive', 'active', 'activating', 'failed' ];
  const regex = /Active: (.*) \(.*\)/gm;
  const out = await systemctl('status', 'jellyfin');
  const matches = [ ...out.matchAll(regex) ];
  if (matches[0] && matches[0][1] && recognizedStatuses.includes(matches[0][1])) {
    return matches[0][1];
  }

  return 'inactive';
}


export async function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE).toString();
      return xml2js.parseStringPromise(data, {
        explicitArray: false,
        valueProcessors: [ parseBooleans ]
      });
    }

    return null;

  }
  catch (error) {
    js.getLogger().error(js.getErrorMessage('[jellyfin_server] Failed to read config:', error));
    return null;
  }
}
