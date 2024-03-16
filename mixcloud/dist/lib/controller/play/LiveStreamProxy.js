"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LiveStreamProxy_instances, _LiveStreamProxy_liveStreamHLSUrl, _LiveStreamProxy_process, _LiveStreamProxy_isRunning, _LiveStreamProxy_sigkill, _LiveStreamProxy_pidExists, _LiveStreamProxy_reset, _PortMonitor_instances, _PortMonitor_port, _PortMonitor_checkTimer, _PortMonitor_clearTimer, _PortMonitor_isPortAvailable;
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const os_1 = require("os");
const events_1 = require("events");
const get_port_1 = __importDefault(require("get-port"));
const pidtree_1 = __importDefault(require("pidtree"));
const MixcloudContext_1 = __importDefault(require("../../MixcloudContext"));
const PROXY_URL = 'http://localhost';
const CMD_TEMPLATE = `streamlink \\
    "{LIVE_STREAM_HLS_URL}" \\
    best \\
    --stdout \\
  | \\
  ffmpeg -hide_banner -loglevel error \\
    -i - \\
    -map 0:a \\
    -f mpegts \\
    -listen 1 "${PROXY_URL}:{PORT}"`;
/**
 * Mixcloud live streams cannot be handled directly by FFmpeg,
 * at least with the version that came with Volumio:
 * - Live streams are HLS-fMP4 instead of HLS-TS which you get for regular shows.
 * - FFmpeg doesn't handle HLS-fMP4 playlists well and invariably returns
 *   'invalid data' errors beyond the first MP4 fragment. The errors seem to
 *   arise when processing video data contained in the fragments.
 *
 * Instead of passing the live stream URL directly to FFmpeg (through MPD),
 * we use a proxy mechanism:
 * - Use Streamlink (https://github.com/streamlink/streamlink) to handle the
 *   HLS-fMP4 playlist and read the MP4 fragments.
 * - Pipe the stream data produced by Streamlink to an FFmpeg process, where we:
 *   1. Extract audio from the stream data
 *   2. Convert the audio-only stream to MPEG-TS format
 *   3. Set the FFmpeg instance to listener mode with a 'proxy stream URL'.
 *
 * The 'proxy stream URL' will thus return an MPEG-TS audio stream that can be
 * handled correctly by MPD. With FFmpeg (the instance created by the proxy) set
 * in listener mode, the Streamlink + audio extraction / conversion process starts
 * when the proxy stream URL is connected to.
 *
 * Note that this process has been tested to work with MPD + FFmpeg on Volumio.
 * There is no guarantee that it will work elsewhere. In fact, preliminary testing
 * with FFmpeg 6 fails - but that doesn't concern us for now.
 */
class LiveStreamProxy {
    constructor(liveStreamHLSUrl) {
        _LiveStreamProxy_instances.add(this);
        _LiveStreamProxy_liveStreamHLSUrl.set(this, void 0);
        _LiveStreamProxy_process.set(this, void 0);
        _LiveStreamProxy_isRunning.set(this, void 0);
        __classPrivateFieldSet(this, _LiveStreamProxy_liveStreamHLSUrl, liveStreamHLSUrl, "f");
        __classPrivateFieldSet(this, _LiveStreamProxy_process, null, "f");
        __classPrivateFieldSet(this, _LiveStreamProxy_isRunning, false, "f");
    }
    start() {
        return new Promise(async (resolve, reject) => {
            const port = await (0, get_port_1.default)();
            const cmd = CMD_TEMPLATE
                .replace('{LIVE_STREAM_HLS_URL}', __classPrivateFieldGet(this, _LiveStreamProxy_liveStreamHLSUrl, "f"))
                .replace('{PORT}', String(port));
            const s = (0, child_process_1.spawn)(cmd, { uid: 1000, gid: 1000, shell: true });
            const pid = s.pid;
            let lastError = null;
            const preStartErrors = [];
            MixcloudContext_1.default.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process spawned for cmd: ${cmd}`);
            const portMonitor = new PortMonitor(port);
            portMonitor
                .once('bind', () => {
                __classPrivateFieldSet(this, _LiveStreamProxy_isRunning, true, "f");
                resolve(`${PROXY_URL}:${port}`);
            })
                .start();
            /**
             * Streamlink piped to ffmpeg with --stdout, so all original stdout
             * messages from Streamlink get sent to stderr instead.
             */
            s.stderr.on('data', (msg) => {
                const _msg = msg.toString();
                MixcloudContext_1.default.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: ${_msg}`);
                if (!__classPrivateFieldGet(this, _LiveStreamProxy_isRunning, "f") && _msg.toLowerCase().includes('error:')) {
                    preStartErrors.push(_msg);
                }
            });
            s.stdout.on('data', (msg) => {
                const _msg = msg.toString();
                MixcloudContext_1.default.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: ${_msg}`);
            });
            s.on('close', (code, signal) => {
                MixcloudContext_1.default.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process closed - code: ${code}, signal: ${signal}`);
                if (!__classPrivateFieldGet(this, _LiveStreamProxy_isRunning, "f")) {
                    if (lastError) {
                        reject(lastError);
                    }
                    else if (preStartErrors.length > 0) {
                        reject(Error(preStartErrors.join(os_1.EOL)));
                    }
                    else {
                        reject(Error('Unknown cause'));
                    }
                }
                portMonitor.stop();
                portMonitor.removeAllListeners();
                __classPrivateFieldGet(this, _LiveStreamProxy_instances, "m", _LiveStreamProxy_reset).call(this);
            });
            s.on('error', (err) => {
                MixcloudContext_1.default.getLogger().error(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process error: ${err.message}`);
                lastError = err;
            });
            __classPrivateFieldSet(this, _LiveStreamProxy_process, s, "f");
        });
    }
    /**
     * Normally you don't have to call this, because streamlink and ffmpeg processes created by
     * the proxy end automatically when the stream playback ends or the connection to the proxy
     * stream URL disconnects (such as when MPD switches to a different song).
     * On the other hand, if MPD fails to connect to the proxy stream URL, then we would have to
     * kill the proxy manually.
     *
     * @returns
     */
    async kill() {
        if (!__classPrivateFieldGet(this, _LiveStreamProxy_isRunning, "f") || !__classPrivateFieldGet(this, _LiveStreamProxy_process, "f")) {
            MixcloudContext_1.default.getLogger().warn('[mixcloud] LiveStreamProxy: cannot kill process that is not running');
            return;
        }
        const proc = __classPrivateFieldGet(this, _LiveStreamProxy_process, "f");
        return new Promise(async (resolve) => {
            let tree;
            try {
                tree = await (0, pidtree_1.default)(proc.pid, { root: true });
            }
            catch (error) {
                MixcloudContext_1.default.getLogger().warn(MixcloudContext_1.default.getErrorMessage('[mixcloud] LiveStreamProxy: failed to obtain PID tree for killing - resolving anyway: ', error));
                __classPrivateFieldGet(this, _LiveStreamProxy_instances, "m", _LiveStreamProxy_reset).call(this);
                resolve();
                return;
            }
            let cleanKill = true;
            let pid = tree.shift();
            while (pid) {
                try {
                    if (__classPrivateFieldGet(this, _LiveStreamProxy_instances, "m", _LiveStreamProxy_pidExists).call(this, pid)) {
                        MixcloudContext_1.default.getLogger().info(`[mixcloud] LiveStreamProxy: killing PID ${pid}`);
                        __classPrivateFieldGet(this, _LiveStreamProxy_instances, "m", _LiveStreamProxy_sigkill).call(this, pid);
                    }
                }
                catch (error) {
                    MixcloudContext_1.default.getLogger().warn(MixcloudContext_1.default.getErrorMessage(`[mixcloud] LiveStreamProxy: error killing PID ${pid} - proceeding anyway: `, error));
                    cleanKill = false;
                }
                pid = tree.shift();
            }
            __classPrivateFieldGet(this, _LiveStreamProxy_instances, "m", _LiveStreamProxy_reset).call(this);
            if (cleanKill) {
                MixcloudContext_1.default.getLogger().info('[mixcloud] LiveStreamProxy killed');
            }
            else {
                MixcloudContext_1.default.getLogger().warn('[mixcloud] LiveStreamProxy killed uncleanly - there may be zombie processes left behind.');
            }
            resolve();
        });
    }
}
_LiveStreamProxy_liveStreamHLSUrl = new WeakMap(), _LiveStreamProxy_process = new WeakMap(), _LiveStreamProxy_isRunning = new WeakMap(), _LiveStreamProxy_instances = new WeakSet(), _LiveStreamProxy_sigkill = function _LiveStreamProxy_sigkill(pid) {
    process.kill(pid, 'SIGKILL');
}, _LiveStreamProxy_pidExists = function _LiveStreamProxy_pidExists(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        return false;
    }
}, _LiveStreamProxy_reset = function _LiveStreamProxy_reset() {
    if (__classPrivateFieldGet(this, _LiveStreamProxy_process, "f")) {
        __classPrivateFieldGet(this, _LiveStreamProxy_process, "f").stdout?.removeAllListeners();
        __classPrivateFieldGet(this, _LiveStreamProxy_process, "f").stderr?.removeAllListeners();
        __classPrivateFieldGet(this, _LiveStreamProxy_process, "f").removeAllListeners();
        __classPrivateFieldSet(this, _LiveStreamProxy_process, null, "f");
        __classPrivateFieldSet(this, _LiveStreamProxy_isRunning, false, "f");
    }
};
exports.default = LiveStreamProxy;
class PortMonitor extends events_1.EventEmitter {
    constructor(port) {
        super();
        _PortMonitor_instances.add(this);
        _PortMonitor_port.set(this, void 0);
        _PortMonitor_checkTimer.set(this, void 0);
        __classPrivateFieldSet(this, _PortMonitor_port, port, "f");
        __classPrivateFieldSet(this, _PortMonitor_checkTimer, null, "f");
    }
    start() {
        if (__classPrivateFieldGet(this, _PortMonitor_checkTimer, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _PortMonitor_checkTimer, setTimeout(async () => {
            __classPrivateFieldGet(this, _PortMonitor_instances, "m", _PortMonitor_clearTimer).call(this);
            if (!(await __classPrivateFieldGet(this, _PortMonitor_instances, "m", _PortMonitor_isPortAvailable).call(this))) {
                this.emit('bind');
            }
            else {
                this.start();
            }
        }, 500), "f");
    }
    stop() {
        __classPrivateFieldGet(this, _PortMonitor_instances, "m", _PortMonitor_clearTimer).call(this);
    }
}
_PortMonitor_port = new WeakMap(), _PortMonitor_checkTimer = new WeakMap(), _PortMonitor_instances = new WeakSet(), _PortMonitor_clearTimer = function _PortMonitor_clearTimer() {
    if (__classPrivateFieldGet(this, _PortMonitor_checkTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _PortMonitor_checkTimer, "f"));
        __classPrivateFieldSet(this, _PortMonitor_checkTimer, null, "f");
    }
}, _PortMonitor_isPortAvailable = 
// https://stackoverflow.com/questions/19129570/how-can-i-check-if-port-is-busy-in-nodejs
async function _PortMonitor_isPortAvailable() {
    return new Promise((resolve) => {
        const s = net_1.default.createServer();
        s.once('error', (err) => {
            s.close();
            if (err && err.code == 'EADDRINUSE') {
                resolve(false);
            }
            else {
                //Reject(err);
                resolve(true);
            }
        });
        s.once('listening', () => {
            resolve(true);
            s.close();
        });
        s.listen(__classPrivateFieldGet(this, _PortMonitor_port, "f"));
    });
};
//# sourceMappingURL=LiveStreamProxy.js.map