// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';
import isValidFilename from 'valid-filename';
import fs from 'fs';
import * as SystemUtils from '../utils/System';
import np from '../NowPlayingContext';
import path from 'path';
import ConfigUpdater from './ConfigUpdater';

const CONFIG_BACKUPS_PATH = '/data/INTERNAL/NowPlayingPlugin/Settings Backups';
const VCONF = new vconf();

export default class ConfigBackupHelper {

  static async getBackupNames(): Promise<string[]> {
    if (!SystemUtils.dirExists(CONFIG_BACKUPS_PATH)) {
      return [];
    }
    const files = SystemUtils.readdir(CONFIG_BACKUPS_PATH);
    const validated = (await Promise.all(files.map((filename) => this.#validateBackup(filename))))
      .reduce<string[]>((result, validateResult) => {
        if (validateResult.isValid) {
          result.push(validateResult.backupName);
        }
        return result;
      }, []);

    try {
      const stats = (await Promise.all(validated.map((backupName) => this.#getModifiedTime(backupName))));
      const sorted = stats.sort((bak1, bak2) => bak2.modified - bak1.modified);
      return sorted.map((s) => s.backupName);
    }
    catch (error: any) {
      np.getLogger().warn(np.getErrorMessage('[now-playing] Unable to get stats of backup files:', error, true));
      return validated;
    }
  }

  static createBackup(backupName: string) {
    const configFilePath = np.getConfigFilePath();
    if (!configFilePath || !SystemUtils.fileExists(configFilePath)) {
      throw Error(`${configFilePath} does not exist`);
    }
    if (!isValidFilename(backupName)) {
      throw Error(`Invalid backup name '${backupName}`);
    }
    const dest = this.#getPathToBackupFile(backupName);
    if (path.parse(dest).dir !== CONFIG_BACKUPS_PATH) {
      throw Error('Illegal attempt to save in non-designated directory');
    }
    SystemUtils.copyFile(configFilePath, dest, { createDestDirIfNotExists: true });
  }

  static deleteBackup(backupName: string) {
    const dest = this.#getPathToBackupFile(backupName);
    if (!fs.existsSync(dest)) {
      return;
    }
    fs.unlinkSync(dest);
  }

  static async replacePluginConfigWithBackup(backupName: string) {
    const src = this.#getPathToBackupFile(backupName);
    if (!SystemUtils.fileExists(src)) {
      throw Error(`${src} does not exist`);
    }
    const validateResult = await this.#validateBackup(backupName);
    if (!validateResult.isValid) {
      throw Error(`Invalid backup '${backupName}'`);
    }
    const dest = np.getConfigFilePath() ? path.resolve(np.getConfigFilePath()) : null;
    const destDir = dest ? path.parse(dest).dir : null;
    if (!dest || !destDir || !SystemUtils.dirExists(destDir)) {
      throw Error(`Destination directory ${destDir} does not exist`);
    }
    try {
      SystemUtils.copyFile(src, dest);
    }
    catch (error) {
      throw Error(`Failed to copy ${src} to ${dest}`);
    }
    ConfigUpdater.checkAndUpdate();
  }

  static #getPathToBackupFile(backupName: string) {
    return path.resolve(`${CONFIG_BACKUPS_PATH}/${backupName}`);
  }

  static #validateBackup(filename: string): Promise<{ backupName: string; isValid: boolean; }> {
    const pathToFile = path.resolve(`${CONFIG_BACKUPS_PATH}/${filename}`);
    return new Promise((resolve) => {
      VCONF.loadFile(pathToFile, (err: any, data: any) => {
        if (err || !data) {
          np.getLogger().error(np.getErrorMessage(`[now-playing] Failed to validate config backup file ${pathToFile}`, err, false));
          resolve({
            backupName: filename,
            isValid: false
          });
          return;
        }

        if (VCONF.has('configVersion')) {
          resolve({
            backupName: filename,
            isValid: true
          });
        }
        else {
          np.getLogger().error(`[now-playing] Incompatible config backup file ${pathToFile}: 'configVersion' required but missing from data`);
          resolve({
            backupName: filename,
            isValid: false
          });
        }
      });
    });
  }

  static #getModifiedTime(backupName: string): Promise<{ backupName: string; modified: number; }> {
    const pathToFile = this.#getPathToBackupFile(backupName);
    return new Promise(async (resolve, reject) => {
      try {
        const stat = await fs.promises.stat(pathToFile);
        resolve({
          backupName,
          modified: stat.mtime.getTime()
        });
      }
      catch (error) {
        reject(error);
      }
    });
  }
}
