import { ChildProcess, spawn } from 'child_process';
import net from 'net';
import { EOL } from 'os';
import { EventEmitter } from 'events';
import getPort from 'get-port';
import pidtree from 'pidtree';
import mixcloud from '../../MixcloudContext';

const PROXY_URL = 'http://localhost';

const CMD_TEMPLATE =
  `streamlink \\
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

export default class LiveStreamProxy {

  #liveStreamHLSUrl: string;
  #process: ChildProcess | null;
  #isRunning: boolean;

  constructor(liveStreamHLSUrl: string) {
    this.#liveStreamHLSUrl = liveStreamHLSUrl;
    this.#process = null;
    this.#isRunning = false;
  }

  start() {
    return new Promise<string>(async (resolve, reject) => {
      const port = await getPort();
      const cmd = CMD_TEMPLATE
        .replace('{LIVE_STREAM_HLS_URL}', this.#liveStreamHLSUrl)
        .replace('{PORT}', String(port));
      const s = spawn(cmd, { uid: 1000, gid: 1000, shell: true });
      const pid = s.pid;
      let lastError: Error | null = null;
      const preStartErrors: string[] = [];

      mixcloud.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process spawned for cmd: ${cmd}`);

      const portMonitor = new PortMonitor(port);
      portMonitor
        .once('bind', () => {
          this.#isRunning = true;
          resolve(`${PROXY_URL}:${port}`);
        })
        .start();

      /**
       * Streamlink piped to ffmpeg with --stdout, so all original stdout
       * messages from Streamlink get sent to stderr instead.
       */

      s.stderr.on('data', (msg) => {
        const _msg = msg.toString() as string;
        mixcloud.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: ${_msg}`);
        if (!this.#isRunning && _msg.toLowerCase().includes('error:')) {
          preStartErrors.push(_msg);
        }
      });

      s.stdout.on('data', (msg) => {
        const _msg = msg.toString();
        mixcloud.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: ${_msg}`);
      });

      s.on('close', (code, signal) => {
        mixcloud.getLogger().info(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process closed - code: ${code}, signal: ${signal}`);
        if (!this.#isRunning) {
          if (lastError) {
            reject(lastError);
          }
          else if (preStartErrors.length > 0) {
            reject(Error(preStartErrors.join(EOL)));
          }
          else {
            reject(Error('Unknown cause'));
          }
        }
        portMonitor.stop();
        portMonitor.removeAllListeners();
        this.#reset();
      });

      s.on('error', (err) => {
        mixcloud.getLogger().error(`[mixcloud] (PID: ${pid}) LiveStreamProxy: process error: ${err.message}`);
        lastError = err;
      });

      this.#process = s;
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
    if (!this.#isRunning || !this.#process) {
      mixcloud.getLogger().warn('[mixcloud] LiveStreamProxy: cannot kill process that is not running');
      return;
    }
    const proc = this.#process;
    return new Promise<void>(async (resolve) => {
      let tree: number[];
      try {
        tree = await pidtree(proc.pid, { root: true });
      }
      catch (error) {
        mixcloud.getLogger().warn(
          mixcloud.getErrorMessage('[mixcloud] LiveStreamProxy: failed to obtain PID tree for killing - resolving anyway: ', error));
        this.#reset();
        resolve();
        return;
      }
      let cleanKill = true;
      let pid = tree.shift();
      while (pid) {
        try {
          if (this.#pidExists(pid)) {
            mixcloud.getLogger().info(`[mixcloud] LiveStreamProxy: killing PID ${pid}`);
            this.#sigkill(pid);
          }
        }
        catch (error) {
          mixcloud.getLogger().warn(
            mixcloud.getErrorMessage(`[mixcloud] LiveStreamProxy: error killing PID ${pid} - proceeding anyway: `, error));
          cleanKill = false;
        }
        pid = tree.shift();
      }
      this.#reset();
      if (cleanKill) {
        mixcloud.getLogger().info('[mixcloud] LiveStreamProxy killed');
      }
      else {
        mixcloud.getLogger().warn('[mixcloud] LiveStreamProxy killed uncleanly - there may be zombie processes left behind.');
      }
      resolve();
    });
  }

  #sigkill(pid: number) {
    process.kill(pid, 'SIGKILL');
  }

  #pidExists(pid: number) {
    try {
      process.kill(pid, 0);
      return true;
    }
    catch (error) {
      return false;
    }
  }

  #reset() {
    if (this.#process) {
      this.#process.stdout?.removeAllListeners();
      this.#process.stderr?.removeAllListeners();
      this.#process.removeAllListeners();
      this.#process = null;
      this.#isRunning = false;
    }
  }
}

class PortMonitor extends EventEmitter {

  #port: number;
  #checkTimer: NodeJS.Timeout | null;

  constructor(port: number) {
    super();
    this.#port = port;
    this.#checkTimer = null;
  }

  start() {
    if (this.#checkTimer) {
      return;
    }

    this.#checkTimer = setTimeout(async () => {
      this.#clearTimer();
      if (!(await this.#isPortAvailable())) {
        this.emit('bind');
      }
      else {
        this.start();
      }
    }, 500);
  }

  stop() {
    this.#clearTimer();
  }

  #clearTimer() {
    if (this.#checkTimer) {
      clearTimeout(this.#checkTimer);
      this.#checkTimer = null;
    }
  }

  // https://stackoverflow.com/questions/19129570/how-can-i-check-if-port-is-busy-in-nodejs
  async #isPortAvailable() {
    return new Promise((resolve) => {
      const s = net.createServer();
      s.once('error', (err: any & { code: string }) => {
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
      s.listen(this.#port);
    });
  }
}
