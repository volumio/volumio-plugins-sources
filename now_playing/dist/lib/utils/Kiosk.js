"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartVolumioKioskService = exports.modifyVolumioKioskScript = exports.restoreVolumioKiosk = exports.configureVolumioKiosk = exports.volumioKioskBackupPathExists = exports.checkVolumioKiosk = void 0;
const SystemUtils = __importStar(require("./System"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const VOLUMIO_KIOSK_PATH = '/opt/volumiokiosk.sh';
const VOLUMIO_KIOSK_BAK_PATH = '/home/volumio/.now_playing/volumiokiosk.sh.bak';
const VOLUMIO_KIOSK_SERVICE_NAME = 'volumio-kiosk';
function checkVolumioKiosk() {
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
        if (SystemUtils.findInFile(VOLUMIO_KIOSK_PATH, `localhost:${NowPlayingContext_1.default.getConfigValue('port')}`)) {
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
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] Error reading Volumio Kiosk script: ', error));
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_CHECK_ERR'));
        return {
            exists: false
        };
    }
}
exports.checkVolumioKiosk = checkVolumioKiosk;
function volumioKioskBackupPathExists() {
    return SystemUtils.fileExists(VOLUMIO_KIOSK_BAK_PATH);
}
exports.volumioKioskBackupPathExists = volumioKioskBackupPathExists;
async function configureVolumioKiosk(display) {
    let oldPort, newPort;
    if (display === 'nowPlaying') {
        oldPort = 3000;
        newPort = NowPlayingContext_1.default.getConfigValue('port');
    }
    else { // `display` === 'default'
        oldPort = NowPlayingContext_1.default.getConfigValue('port');
        newPort = 3000;
    }
    await modifyVolumioKioskScript(oldPort, newPort);
    NowPlayingContext_1.default.setConfigValue('kioskDisplay', display);
}
exports.configureVolumioKiosk = configureVolumioKiosk;
async function restoreVolumioKiosk() {
    if (!volumioKioskBackupPathExists()) {
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_BAK_NOT_FOUND'));
        return;
    }
    try {
        SystemUtils.copyFile(VOLUMIO_KIOSK_BAK_PATH, VOLUMIO_KIOSK_PATH, { asRoot: true });
        restartVolumioKioskService();
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] Error restoring kiosk script from backup: ', error));
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_RESTORE_BAK_ERR'));
    }
}
exports.restoreVolumioKiosk = restoreVolumioKiosk;
async function modifyVolumioKioskScript(oldPort, newPort, restartService = true) {
    try {
        if (oldPort == 3000) {
            NowPlayingContext_1.default.getLogger().info(`[now-playing] Backing up ${VOLUMIO_KIOSK_PATH} to ${VOLUMIO_KIOSK_BAK_PATH}`);
            SystemUtils.copyFile(VOLUMIO_KIOSK_PATH, VOLUMIO_KIOSK_BAK_PATH, { createDestDirIfNotExists: true });
        }
        SystemUtils.replaceInFile(VOLUMIO_KIOSK_PATH, `localhost:${oldPort}`, `localhost:${newPort}`);
        NowPlayingContext_1.default.toast('success', NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_MODIFIED'));
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] Error modifying Volumio Kiosk script:', error));
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_KIOSK_MODIFY_ERR'));
        throw error;
    }
    if (restartService) {
        return restartVolumioKioskService();
    }
}
exports.modifyVolumioKioskScript = modifyVolumioKioskScript;
async function restartVolumioKioskService() {
    // Restart volumio-kiosk service if it is active
    const isActive = await SystemUtils.isSystemdServiceActive(VOLUMIO_KIOSK_SERVICE_NAME);
    if (isActive) {
        NowPlayingContext_1.default.toast('info', 'Restarting Volumio Kiosk service...');
        try {
            return SystemUtils.restartSystemdService(VOLUMIO_KIOSK_SERVICE_NAME);
        }
        catch (error) {
            NowPlayingContext_1.default.toast('error', 'Failed to restart Volumio Kiosk service.');
        }
    }
}
exports.restartVolumioKioskService = restartVolumioKioskService;
//# sourceMappingURL=Kiosk.js.map