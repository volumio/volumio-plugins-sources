import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import pluginInfo from '../../../package.json';
import np from '../NowPlayingContext';

export interface PluginInfo {
  appPort: number;
  version: string | null;
  appUrl: string;
  previewUrl: string;
  apiPath: string;
}

export function fileExists(path: string) {
  try {
    return fs.existsSync(path) && fs.lstatSync(path).isFile();
  }
  catch (error) {
    return false;
  }
}

export function dirExists(path: string) {
  try {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
  }
  catch (error) {
    return false;
  }
}

export function findInFile(path: string, str: string) {
  const contents = fs.readFileSync(path).toString();
  const regex = new RegExp(`\\b${str}\\b`, 'gm');
  return regex.test(contents);
}

export function replaceInFile(path: string, search: string, replace: string) {
  const cmd = `echo volumio | sudo -S sed -i 's/${search}/${replace}/g' "${path}"`;
  return execSync(cmd, { uid: 1000, gid: 1000 });
}

export function copyFile(src: string, dest: string, opts?: {
  asRoot?: boolean;
  createDestDirIfNotExists?: boolean;
}) {
  const asRoot = !!opts?.asRoot;
  const createDestDirIfNotExists = !!opts?.createDestDirIfNotExists;
  const cmdPrefix = asRoot ? 'echo volumio | sudo -S' : '';
  if (createDestDirIfNotExists) {
    const p = path.parse(dest);
    execSync(`${cmdPrefix} mkdir -p "${p.dir}"`);
  }
  execSync(`${cmdPrefix} cp "${src}" "${dest}"`);
}

function systemctl(cmd: string, service: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullCmd = `/usr/bin/sudo /bin/systemctl ${cmd} ${service}`;
    np.getLogger().info(`[now-playing] Executing ${fullCmd}`);
    exec(fullCmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
      if (error) {
        np.getLogger().error(np.getErrorMessage(`[now-playing] Failed to execute systemctl command ${cmd} on ${service}: ${stderr.toString()}`, error));
        reject(error);
      }
      else {
        resolve(stdout.toString());
      }
    });
  });
}

export async function isSystemdServiceActive(service: string) {
  const out = await systemctl('status', service);
  return out.indexOf('active') >= 0 && out.indexOf('inactive') == -1;
}

export function restartSystemdService(service: string) {
  return systemctl('restart', service);
}

export function readdir(path: string, ignoreIfContains?: string) {
  let files = fs.readdirSync(path);
  if (ignoreIfContains) {
    files = files.filter((f) => f.indexOf(ignoreIfContains) < 0);
  }
  return files;
}

export function getPluginVersion() {
  return pluginInfo.version || null;
}

export function getPluginInfo(): PluginInfo {
  let cached = np.get<PluginInfo>('pluginInfo');

  if (!cached) {
    const appPort = np.getConfigValue('port');
    const version = getPluginVersion();
    const thisDevice = np.getDeviceInfo();
    const appUrl = `${thisDevice.host}:${appPort}`;
    const previewUrl = `${appUrl}/preview`;
    const apiPath = `${appUrl}/api`;

    cached = {
      appPort, version, appUrl, previewUrl, apiPath
    };

    np.set('pluginInfo', cached);
  }

  return cached;
}
