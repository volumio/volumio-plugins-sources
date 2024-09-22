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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _ConfigBackupHelper_getPathToBackupFile, _ConfigBackupHelper_validateBackup, _ConfigBackupHelper_getModifiedTime;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const valid_filename_1 = __importDefault(require("valid-filename"));
const fs_1 = __importDefault(require("fs"));
const SystemUtils = __importStar(require("../utils/System"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const path_1 = __importDefault(require("path"));
const ConfigUpdater_1 = __importDefault(require("./ConfigUpdater"));
const CONFIG_BACKUPS_PATH = '/data/INTERNAL/NowPlayingPlugin/Settings Backups';
const VCONF = new v_conf_1.default();
class ConfigBackupHelper {
    static async getBackupNames() {
        if (!SystemUtils.dirExists(CONFIG_BACKUPS_PATH)) {
            return [];
        }
        const files = SystemUtils.readdir(CONFIG_BACKUPS_PATH);
        const validated = (await Promise.all(files.map((filename) => __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_validateBackup).call(this, filename))))
            .reduce((result, validateResult) => {
            if (validateResult.isValid) {
                result.push(validateResult.backupName);
            }
            return result;
        }, []);
        try {
            const stats = (await Promise.all(validated.map((backupName) => __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_getModifiedTime).call(this, backupName))));
            const sorted = stats.sort((bak1, bak2) => bak2.modified - bak1.modified);
            return sorted.map((s) => s.backupName);
        }
        catch (error) {
            NowPlayingContext_1.default.getLogger().warn(NowPlayingContext_1.default.getErrorMessage('[now-playing] Unable to get stats of backup files:', error, true));
            return validated;
        }
    }
    static createBackup(backupName) {
        const configFilePath = NowPlayingContext_1.default.getConfigFilePath();
        if (!configFilePath || !SystemUtils.fileExists(configFilePath)) {
            throw Error(`${configFilePath} does not exist`);
        }
        if (!(0, valid_filename_1.default)(backupName)) {
            throw Error(`Invalid backup name '${backupName}`);
        }
        const dest = __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_getPathToBackupFile).call(this, backupName);
        if (path_1.default.parse(dest).dir !== CONFIG_BACKUPS_PATH) {
            throw Error('Illegal attempt to save in non-designated directory');
        }
        SystemUtils.copyFile(configFilePath, dest, { createDestDirIfNotExists: true });
    }
    static deleteBackup(backupName) {
        const dest = __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_getPathToBackupFile).call(this, backupName);
        if (!fs_1.default.existsSync(dest)) {
            return;
        }
        fs_1.default.unlinkSync(dest);
    }
    static async replacePluginConfigWithBackup(backupName) {
        const src = __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_getPathToBackupFile).call(this, backupName);
        if (!SystemUtils.fileExists(src)) {
            throw Error(`${src} does not exist`);
        }
        const validateResult = await __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_validateBackup).call(this, backupName);
        if (!validateResult.isValid) {
            throw Error(`Invalid backup '${backupName}'`);
        }
        const dest = NowPlayingContext_1.default.getConfigFilePath() ? path_1.default.resolve(NowPlayingContext_1.default.getConfigFilePath()) : null;
        const destDir = dest ? path_1.default.parse(dest).dir : null;
        if (!dest || !destDir || !SystemUtils.dirExists(destDir)) {
            throw Error(`Destination directory ${destDir} does not exist`);
        }
        try {
            SystemUtils.copyFile(src, dest);
        }
        catch (error) {
            throw Error(`Failed to copy ${src} to ${dest}`);
        }
        ConfigUpdater_1.default.checkAndUpdate();
    }
}
exports.default = ConfigBackupHelper;
_a = ConfigBackupHelper, _ConfigBackupHelper_getPathToBackupFile = function _ConfigBackupHelper_getPathToBackupFile(backupName) {
    return path_1.default.resolve(`${CONFIG_BACKUPS_PATH}/${backupName}`);
}, _ConfigBackupHelper_validateBackup = function _ConfigBackupHelper_validateBackup(filename) {
    const pathToFile = path_1.default.resolve(`${CONFIG_BACKUPS_PATH}/${filename}`);
    return new Promise((resolve) => {
        VCONF.loadFile(pathToFile, (err, data) => {
            if (err || !data) {
                NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Failed to validate config backup file ${pathToFile}`, err, false));
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
                NowPlayingContext_1.default.getLogger().error(`[now-playing] Incompatible config backup file ${pathToFile}: 'configVersion' required but missing from data`);
                resolve({
                    backupName: filename,
                    isValid: false
                });
            }
        });
    });
}, _ConfigBackupHelper_getModifiedTime = function _ConfigBackupHelper_getModifiedTime(backupName) {
    const pathToFile = __classPrivateFieldGet(this, _a, "m", _ConfigBackupHelper_getPathToBackupFile).call(this, backupName);
    return new Promise(async (resolve, reject) => {
        try {
            const stat = await fs_1.default.promises.stat(pathToFile);
            resolve({
                backupName,
                modified: stat.mtime.getTime()
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
//# sourceMappingURL=ConfigBackupHelper.js.map