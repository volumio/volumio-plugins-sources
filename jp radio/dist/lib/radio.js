"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JpRadio_instances, _JpRadio_setupRoutes, _JpRadio_init, _JpRadio_pgupdate;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const icy_metadata_1 = __importDefault(require("icy-metadata"));
const lodash_1 = require("lodash");
const prog_1 = __importDefault(require("./prog"));
const radiko_1 = __importDefault(require("./radiko"));
class JpRadio {
    constructor(port = 9000, logger, acct = null, commandRouter) {
        _JpRadio_instances.add(this);
        this.server = null;
        this.prg = null;
        this.rdk = null;
        this.app = (0, express_1.default)();
        this.port = port;
        this.logger = logger;
        this.acct = acct;
        this.commandRouter = commandRouter;
        this.task = node_cron_1.default.schedule('0 3,9,15 * * *', __classPrivateFieldGet(this, _JpRadio_instances, "m", _JpRadio_pgupdate).bind(this), {
            scheduled: false
        });
        __classPrivateFieldGet(this, _JpRadio_instances, "m", _JpRadio_setupRoutes).call(this);
    }
    async radioStations() {
        if (!this.rdk?.stations) {
            return {
                navigation: {
                    lists: [{
                            title: 'LIVE',
                            availableListViews: ['grid', 'list'],
                            items: []
                        }]
                },
                uri: 'radiko'
            };
        }
        const entries = Array.from(this.rdk.stations.entries());
        // 地域名ごとにグループ化
        const grouped = {};
        await Promise.all(entries.map(async ([stationId, stationInfo]) => {
            const progData = await this.prg?.getCurProgram(stationId);
            const progTitle = progData ? ` - ${progData.pfm || ''} - ${progData.title || ''}` : '';
            const title = `${(0, lodash_1.capitalize)(stationInfo.AreaName)} / ${stationInfo.Name}${progTitle}`;
            const item = {
                service: 'webradio',
                type: 'song',
                title,
                albumart: stationInfo.BannerURL || '',
                uri: `http://localhost:${this.port}/radiko/${stationId}`,
                name: '',
                samplerate: '',
                bitdepth: 0,
                channels: 0
            };
            const region = stationInfo.RegionName || 'その他';
            if (!grouped[region]) {
                grouped[region] = [];
            }
            grouped[region].push(item);
        }));
        // BrowseList を作成
        const lists = Object.entries(grouped).map(([regionName, items]) => ({
            title: regionName,
            availableListViews: ['grid', 'list'],
            items
        }));
        const result = {
            navigation: {
                lists
            },
            uri: 'radiko'
        };
        return result;
    }
    async start() {
        if (this.server) {
            this.logger.info('JP_Radio::Already started');
            this.commandRouter.pushToastMessage('info', 'JP Radio', 'すでに起動しています');
            return;
        }
        this.prg = new prog_1.default(this.logger);
        this.rdk = new radiko_1.default(this.port, this.logger, this.acct);
        await __classPrivateFieldGet(this, _JpRadio_instances, "m", _JpRadio_init).call(this);
        return new Promise((resolve, reject) => {
            this.server = this.app
                .listen(this.port, () => {
                this.logger.info(`JP_Radio::Listening on port ${this.port}`);
                this.commandRouter.pushToastMessage('success', 'JP Radio', '起動しました');
                this.commandRouter.servicePushState({
                    status: 'play',
                    service: 'jp_radio',
                    title: 'Radiko 起動中',
                    uri: ''
                });
                this.task.start();
                resolve();
            })
                .on('error', (err) => {
                this.logger.error('JP_Radio::App error:', err);
                this.commandRouter.pushToastMessage('error', 'JP Radio 起動失敗', err.message || 'エラー');
                reject(err);
            });
        });
    }
    async stop() {
        if (this.server) {
            this.task.stop();
            this.server.close();
            this.server = null;
            await this.prg?.dbClose();
            this.prg = null;
            this.rdk = null;
            this.commandRouter.pushToastMessage('info', 'JP Radio', '停止しました');
        }
    }
}
_JpRadio_instances = new WeakSet(), _JpRadio_setupRoutes = function _JpRadio_setupRoutes() {
    this.app.get('/radiko/:stationID', async (req, res) => {
        const station = req.params['stationID'];
        if (!this.rdk || !this.rdk.stations?.has(station)) {
            const msg = !this.rdk
                ? 'JP_Radio::Radiko instance not initialized'
                : `JP_Radio::${station} not in available stations`;
            this.logger.error(msg);
            res.status(500).send(msg);
            return;
        }
        try {
            const icyMetadata = new icy_metadata_1.default();
            const ffmpeg = await this.rdk.play(station);
            if (!ffmpeg || !ffmpeg.stdout) {
                this.logger.error('JP_Radio::ffmpeg start failed or stdout is null');
                res.status(500).send('Stream start error');
                return;
            }
            let ffmpegExited = false;
            ffmpeg.on('exit', () => {
                ffmpegExited = true;
                this.logger.debug(`ffmpeg process ${ffmpeg.pid} exited.`);
            });
            const progData = await this.prg?.getCurProgram(station);
            if (progData) {
                const title = `${progData.pfm || ''} - ${progData.title || ''}`;
                icyMetadata.setStreamTitle(title);
            }
            res.set({
                'Cache-Control': 'no-cache, no-store',
                'icy-name': await this.rdk.getStationAsciiName(station),
                'icy-metaint': icyMetadata.metaInt,
                'Content-Type': 'audio/aac',
                Connection: 'keep-alive'
            });
            ffmpeg.stdout.pipe(icyMetadata).pipe(res);
            res.on('close', () => {
                if (ffmpeg.pid && !ffmpegExited) {
                    try {
                        process.kill(-ffmpeg.pid, 'SIGTERM');
                        this.logger.info(`SIGTERM sent to ffmpeg group ${ffmpeg.pid}`);
                    }
                    catch (e) {
                        this.logger.warn(`Kill ffmpeg failed: ${e.code === 'ESRCH' ? 'Already exited' : e.message}`);
                    }
                }
            });
            this.logger.info('JP_Radio::Streaming started');
        }
        catch (err) {
            this.logger.error('JP_Radio::Stream error', err);
            res.status(500).send('Internal server error');
        }
    });
    this.app.get('/radiko/', (_req, res) => {
        res.send("Hello, world. You're at the radiko_app index.");
    });
}, _JpRadio_init = async function _JpRadio_init() {
    if (this.rdk)
        await this.rdk.init(this.acct);
    await __classPrivateFieldGet(this, _JpRadio_instances, "m", _JpRadio_pgupdate).call(this);
}, _JpRadio_pgupdate = async function _JpRadio_pgupdate() {
    this.logger.info('JP_Radio::Updating program listings');
    await this.prg?.updatePrograms();
    await this.prg?.clearOldProgram();
};
exports.default = JpRadio;
//# sourceMappingURL=radio.js.map