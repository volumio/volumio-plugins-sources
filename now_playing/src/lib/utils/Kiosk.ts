import * as SystemUtils from './System';
import np from '../NowPlayingContext';

const VOLUMIO_KIOSK_PATH = '/opt/volumiokiosk.sh';
const VOLUMIO_KIOSK_BAK_PATH = '/home/volumio/.now_playing/volumiokiosk.sh.bak';
const VOLUMIO_KIOSK_SERVICE_NAME = 'volumio-kiosk';

export function checkVolumioKiosk() {
  try {
    if (!SystemUtils.fileExists(VOLUMIO_KIOSK_PATH)) {
      return {
        exists: false
      };
    }

    if (SystemUtils.findInFile(VOLUMIO_KIOSK_PATH, 'localhost:3000')) {
      return {
        exists: true,
        display: 'default'
      };
    }

    if (SystemUtils.findInFile(VOLUMIO_KIOSK_PATH, `localhost:${np.getConfigValue('port')}`)) {
      return {
        exists: true,
        display: 'nowPlaying'
      };
    }

    return {
      exists: true,
      display: 'unknown'
    };

  }
  catch (error) {
    np.getLogger().error(np.getErrorMessage('[now-playing] Error reading Volumio Kiosk script: ', error));
    np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_CHECK_ERR'));
    return {
      exists: false
    };
  }
}

export function volumioKioskBackupPathExists() {
  return SystemUtils.fileExists(VOLUMIO_KIOSK_BAK_PATH);
}

export async function configureVolumioKiosk(display: 'nowPlaying' | 'default') {
  let oldPort, newPort;
  if (display === 'nowPlaying') {
    oldPort = 3000;
    newPort = np.getConfigValue('port');
  }
  else { // `display` === 'default'
    oldPort = np.getConfigValue('port');
    newPort = 3000;
  }

  await modifyVolumioKioskScript(oldPort, newPort);
  np.setConfigValue('kioskDisplay', display);
}

export async function restoreVolumioKiosk() {
  if (!volumioKioskBackupPathExists()) {
    np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_BAK_NOT_FOUND'));
    return;
  }
  try {
    SystemUtils.copyFile(VOLUMIO_KIOSK_BAK_PATH, VOLUMIO_KIOSK_PATH, { asRoot: true });
    restartVolumioKioskService();
  }
  catch (error) {
    np.getLogger().error(np.getErrorMessage('[now-playing] Error restoring kiosk script from backup: ', error));
    np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_RESTORE_BAK_ERR'));
  }
}

export async function modifyVolumioKioskScript(oldPort: number, newPort: number, restartService = true) {
  try {
    if (oldPort == 3000) {
      np.getLogger().info(`[now-playing] Backing up ${VOLUMIO_KIOSK_PATH} to ${VOLUMIO_KIOSK_BAK_PATH}`);
      SystemUtils.copyFile(VOLUMIO_KIOSK_PATH, VOLUMIO_KIOSK_BAK_PATH, { createDestDirIfNotExists: true });
    }
    SystemUtils.replaceInFile(VOLUMIO_KIOSK_PATH, `localhost:${oldPort}`, `localhost:${newPort}`);
    np.toast('success', np.getI18n('NOW_PLAYING_KIOSK_MODIFIED'));
  }
  catch (error: any) {
    np.getLogger().error(np.getErrorMessage('[now-playing] Error modifying Volumio Kiosk script:', error));
    np.toast('error', np.getI18n('NOW_PLAYING_KIOSK_MODIFY_ERR'));
    throw error;
  }

  if (restartService) {
    return restartVolumioKioskService();
  }
}

export async function restartVolumioKioskService() {
  // Restart volumio-kiosk service if it is active
  const isActive = await SystemUtils.isSystemdServiceActive(VOLUMIO_KIOSK_SERVICE_NAME);
  if (isActive) {
    np.toast('info', 'Restarting Volumio Kiosk service...');
    try {
      return SystemUtils.restartSystemdService(VOLUMIO_KIOSK_SERVICE_NAME);
    }
    catch (error: any) {
      np.toast('error', 'Failed to restart Volumio Kiosk service.');
    }
  }
}
