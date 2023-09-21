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
exports.getConfig = exports.getServiceStatus = exports.stopService = exports.startService = void 0;
const JellyfinServerContext_1 = __importDefault(require("./JellyfinServerContext"));
const xml2js_1 = __importDefault(require("xml2js"));
const processors_1 = require("xml2js/lib/processors");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const CONFIG_FILE = '/opt/jellyfin/config/network.xml';
function execCommand(cmd, sudo = false) {
    return new Promise((resolve, reject) => {
        JellyfinServerContext_1.default.getLogger().info(`[jellyfin_server] Executing ${cmd}`);
        (0, child_process_1.exec)(sudo ? `echo volumio | sudo -S ${cmd}` : cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
            if (error) {
                JellyfinServerContext_1.default.getLogger().error(JellyfinServerContext_1.default.getErrorMessage(`[jellyfin_server] Failed to execute ${cmd}: ${stderr.toString()}`, error));
                reject(error);
            }
            else {
                resolve(stdout.toString());
            }
        });
    });
}
function systemctl(cmd, service = '') {
    const fullCmd = `/usr/bin/sudo /bin/systemctl ${cmd} ${service} || true`;
    return execCommand(fullCmd);
}
function resolveOnServiceStatusMatch(status, matchConsecutive = 1, retries = 5) {
    let consecutiveCount = 0;
    let tryCount = 0;
    const startCheckTimer = (resolve, reject) => {
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
async function startService() {
    await systemctl('start', 'jellyfin');
    await resolveOnServiceStatusMatch('active', 5);
}
exports.startService = startService;
async function stopService() {
    await systemctl('stop', 'jellyfin');
    return resolveOnServiceStatusMatch(['inactive', 'failed']);
}
exports.stopService = stopService;
async function getServiceStatus() {
    const recognizedStatuses = ['inactive', 'active', 'activating', 'failed'];
    const regex = /Active: (.*) \(.*\)/gm;
    const out = await systemctl('status', 'jellyfin');
    const matches = [...out.matchAll(regex)];
    if (matches[0] && matches[0][1] && recognizedStatuses.includes(matches[0][1])) {
        return matches[0][1];
    }
    return 'inactive';
}
exports.getServiceStatus = getServiceStatus;
async function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE).toString();
            return xml2js_1.default.parseStringPromise(data, {
                explicitArray: false,
                valueProcessors: [processors_1.parseBooleans]
            });
        }
        return null;
    }
    catch (error) {
        JellyfinServerContext_1.default.getLogger().error(JellyfinServerContext_1.default.getErrorMessage('[jellyfin_server] Failed to read config:', error));
        return null;
    }
}
exports.getConfig = getConfig;
//# sourceMappingURL=System.js.map