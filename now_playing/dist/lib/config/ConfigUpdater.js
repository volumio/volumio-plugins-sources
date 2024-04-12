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
var _a, _ConfigUpdater_getUpdaters, _ConfigUpdater_updateConfigData, _ConfigUpdater_updateConfigVersion;
Object.defineProperty(exports, "__esModule", { value: true });
const semver = __importStar(require("semver"));
const fs_1 = __importDefault(require("fs"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const System_1 = require("../utils/System");
const path_1 = __importDefault(require("path"));
const CONFIG_UPDATER_PATH = path_1.default.resolve(`${__dirname}/updaters`);
class ConfigUpdater {
    static async checkAndUpdate() {
        const pluginVersion = (0, System_1.getPluginVersion)();
        const configVersion = NowPlayingContext_1.default.getConfigValue('configVersion');
        if (!pluginVersion) {
            NowPlayingContext_1.default.getLogger().error('[now-playing] ConfigUpdater: failed to obtain plugin version. Not going to update config.');
            return;
        }
        if (!configVersion) {
            NowPlayingContext_1.default.getLogger().info('[now-playing] ConfigUpdater: config version unavailable. Either this is the first time the plugin is installed, or the previous version is < 0.3.0). Config will not be updated.');
            __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_updateConfigVersion).call(this, pluginVersion);
        }
        else if (semver.satisfies(pluginVersion, configVersion)) {
            NowPlayingContext_1.default.getLogger().info('[now-playing] ConfigUpdater: config is up to date.');
        }
        else if (semver.gt(configVersion, pluginVersion)) {
            NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: config version is newer than plugin version (${configVersion} > ${pluginVersion}). Config will not be updated.`);
            __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_updateConfigVersion).call(this, pluginVersion);
        }
        else if (semver.lt(configVersion, pluginVersion)) {
            NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: config version is older than plugin version (${configVersion} < ${pluginVersion}). Will check and apply config updates.`);
            await __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_updateConfigData).call(this, configVersion, pluginVersion);
        }
    }
}
exports.default = ConfigUpdater;
_a = ConfigUpdater, _ConfigUpdater_getUpdaters = function _ConfigUpdater_getUpdaters() {
    const matchRegEx = /config_from_(.*).js$/;
    return fs_1.default.readdirSync(CONFIG_UPDATER_PATH).reduce((paths, file) => {
        const matches = file.match(matchRegEx);
        if (matches) {
            const _from = matches[1];
            if (_from) {
                paths.push({
                    path: path_1.default.join(CONFIG_UPDATER_PATH, file),
                    fromVersion: _from.replace(/_/g, '.')
                });
            }
        }
        return paths;
    }, [])
        .sort((up1, up2) => semver.lt(up1.fromVersion, up2.fromVersion) ? -1 : 1);
}, _ConfigUpdater_updateConfigData = async function _ConfigUpdater_updateConfigData(fromVersion, toVersion, remainingUpdaters) {
    let updaters;
    if (remainingUpdaters) {
        updaters = remainingUpdaters;
    }
    else {
        try {
            updaters = __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_getUpdaters).call(this);
        }
        catch (e) {
            NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] ConfigUpdater: error fetching config updaters from "${CONFIG_UPDATER_PATH}":`, e));
            return;
        }
    }
    const applyIndex = updaters.findIndex((up) => semver.eq(up.fromVersion, fromVersion) || semver.gt(up.fromVersion, fromVersion));
    const applyUpdater = applyIndex >= 0 ? updaters[applyIndex] : null;
    if (!applyUpdater) {
        NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: no ${remainingUpdaters ? 'more ' : ''}config updaters found.`);
        __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_updateConfigVersion).call(this, toVersion);
    }
    else {
        NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: running config updater at "${applyUpdater.path}"...`);
        try {
            const updater = await import(applyUpdater.path);
            updater.update();
        }
        catch (e) {
            NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage('[now-playing] ConfigUpdater: error running config updater:', e));
            return;
        }
        const updatedVersion = NowPlayingContext_1.default.getConfigValue('configVersion');
        if (updatedVersion) {
            NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: config version updated to ${updatedVersion}. Checking if there are further updates to be performed...`);
            __classPrivateFieldGet(this, _a, "m", _ConfigUpdater_updateConfigData).call(this, updatedVersion, toVersion, updaters.slice(applyIndex + 1));
        }
        else {
            NowPlayingContext_1.default.getLogger().error('[now-playing] ConfigUpdater: error reading config version after last update. Aborting update process (config might be corrupt)...');
        }
    }
}, _ConfigUpdater_updateConfigVersion = function _ConfigUpdater_updateConfigVersion(toVersion) {
    NowPlayingContext_1.default.setConfigValue('configVersion', toVersion);
    NowPlayingContext_1.default.getLogger().info(`[now-playing] ConfigUpdater: updated config version to ${toVersion}`);
};
//# sourceMappingURL=ConfigUpdater.js.map