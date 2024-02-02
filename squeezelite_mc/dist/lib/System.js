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
exports.getAlsaFormats = exports.getSqueezeliteServiceStatus = exports.stopSqueezeliteService = exports.initSqueezeliteService = exports.SystemErrorCode = exports.SystemError = exports.SQUEEZELITE_LOG_FILE = void 0;
const path_1 = __importDefault(require("path"));
const SqueezeliteMCContext_1 = __importDefault(require("./SqueezeliteMCContext"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const Util_1 = require("./Util");
const SYSTEMD_TEMPLATE_FILE = `${path_1.default.resolve(__dirname)}/../templates/systemd/squeezelite.service.template`;
const SYSTEMD_SERVICE_FILE = '/etc/systemd/system/squeezelite.service';
const ALSA_CONF_TEMPLATE_FILE = `${path_1.default.resolve(__dirname)}/../templates/alsa/100-squeezelite.conf.template`;
const ALSA_CONF_FILE = '/etc/alsa/conf.d/100-squeezelite.conf';
exports.SQUEEZELITE_LOG_FILE = '/tmp/squeezelite.log';
class SystemError extends Error {
}
exports.SystemError = SystemError;
var SystemErrorCode;
(function (SystemErrorCode) {
    SystemErrorCode[SystemErrorCode["DeviceBusy"] = -1] = "DeviceBusy";
})(SystemErrorCode = exports.SystemErrorCode || (exports.SystemErrorCode = {}));
function execCommand(cmd, sudo = false) {
    return new Promise((resolve, reject) => {
        SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Executing ${cmd}`);
        (0, child_process_1.exec)(sudo ? `echo volumio | sudo -S ${cmd}` : cmd, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
            if (error) {
                SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage(`[squeezelite_mc] Failed to execute ${cmd}: ${stderr.toString()}`, error));
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
async function restartSqueezeliteService() {
    const status = await getSqueezeliteServiceStatus();
    const stopPromise = status === 'active' ? stopSqueezeliteService() : Promise.resolve();
    await stopPromise;
    const rmLogPromise = fs.existsSync(exports.SQUEEZELITE_LOG_FILE) ? execCommand(`rm ${exports.SQUEEZELITE_LOG_FILE}`, true) : Promise.resolve();
    await rmLogPromise;
    await systemctl('start', 'squeezelite');
    try {
        await resolveOnSqueezeliteServiceStatusMatch('active', 5);
    }
    catch (error) {
        // Look for recognizable error in log file
        const throwErr = new SystemError();
        if (fs.existsSync(exports.SQUEEZELITE_LOG_FILE)) {
            const log = fs.readFileSync(exports.SQUEEZELITE_LOG_FILE).toString();
            if (log.indexOf('Device or resource busy') >= 0) {
                throwErr.code = SystemErrorCode.DeviceBusy;
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
    };
    return new Promise((resolve, reject) => {
        startCheckTimer(resolve, reject);
    });
}
async function updateSqueezeliteService(params) {
    const startupOpts = params.type === 'basic' ? (0, Util_1.basicPlayerStartupParamsToSqueezeliteOpts)(params) : params.startupOptions;
    const template = fs.readFileSync(SYSTEMD_TEMPLATE_FILE).toString();
    /* eslint-disable-next-line no-template-curly-in-string */
    const out = template.replace('${STARTUP_OPTS}', startupOpts);
    fs.writeFileSync(`${SYSTEMD_TEMPLATE_FILE}.out`, out);
    const cpCmd = `cp ${SYSTEMD_TEMPLATE_FILE}.out ${SYSTEMD_SERVICE_FILE}`;
    await execCommand(cpCmd, true);
    return true;
}
async function updateAlsaConf(conf) {
    const template = fs.readFileSync(ALSA_CONF_TEMPLATE_FILE).toString();
    let ctl;
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
async function initSqueezeliteService(params) {
    await updateAlsaConf(params);
    await updateSqueezeliteService(params);
    await systemctl('daemon-reload');
    return restartSqueezeliteService();
}
exports.initSqueezeliteService = initSqueezeliteService;
async function stopSqueezeliteService() {
    await systemctl('stop', 'squeezelite');
    return resolveOnSqueezeliteServiceStatusMatch(['inactive', 'failed']);
}
exports.stopSqueezeliteService = stopSqueezeliteService;
async function getSqueezeliteServiceStatus() {
    const recognizedStatuses = ['inactive', 'active', 'activating', 'failed'];
    const regex = /Active: (.*) \(.*\)/gm;
    const out = await systemctl('status', 'squeezelite');
    const matches = [...out.matchAll(regex)];
    if (matches[0] && matches[0][1] && recognizedStatuses.includes(matches[0][1])) {
        return matches[0][1];
    }
    return 'inactive';
}
exports.getSqueezeliteServiceStatus = getSqueezeliteServiceStatus;
async function getAlsaFormats(card) {
    //Const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 | sed -e '1,/Available formats:/d' | awk -F'-' '{print $2}' | awk '{$1=$1}1'`;
    const regExFormatsList = /Available formats:\n(.*)/gms;
    const regExFormats = /^- (.*)/gm;
    const cmd = `aplay -D hw:${card} --nonblock -f MPEG /dev/zero  2>&1 || true`;
    const output = await execCommand(cmd);
    if (output.indexOf('Device or resource busy') >= 0) {
        SqueezeliteMCContext_1.default.getLogger().error(`[squeezelite_mc] Could not query supported ALSA formats for card ${card} because device is busy`);
        const err = new SystemError();
        err.code = SystemErrorCode.DeviceBusy;
        throw err;
    }
    else {
        const formatsListMatches = [...output.matchAll(regExFormatsList)];
        const formatsList = formatsListMatches[0] && formatsListMatches[0][1] ? formatsListMatches[0][1] : null;
        if (formatsList) {
            const formatsMatches = [...formatsList.matchAll(regExFormats)];
            const formats = formatsMatches.map((match) => (match[1] || '').trim());
            SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Card ${card} supports the following ALSA formats: ${JSON.stringify(formats)}`);
            return formats;
        }
        SqueezeliteMCContext_1.default.getLogger().warn(`[squeezelite_mc] No supported ALSA formats found for card ${card}`);
        return [];
    }
}
exports.getAlsaFormats = getAlsaFormats;
//# sourceMappingURL=System.js.map