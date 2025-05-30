import express, { Application, Request, Response } from 'express';
import cron from 'node-cron';
import IcyMetadata from 'icy-metadata';
import { capitalize } from 'lodash';
import RdkProg from './prog';
import Radiko from './radiko';
import type { BrowseItem, BrowseList, BrowseResult} from './models/BrowseResultModel';

export default class JpRadio {
  private readonly app: Application;
  private server: ReturnType<Application['listen']> | null = null;
  private readonly task: ReturnType<typeof cron.schedule>;
  private readonly port: number;
  private readonly logger: Console;
  private readonly acct: any;
  private readonly commandRouter: any;
  private prg: RdkProg | null = null;
  private rdk: Radiko | null = null;

  constructor(port = 9000, logger: Console, acct: any = null, commandRouter: any) {
    this.app = express();
    this.port = port;
    this.logger = logger;
    this.acct = acct;
    this.commandRouter = commandRouter;

    this.task = cron.schedule('0 3,9,15 * * *', this.#pgupdate.bind(this), {
      scheduled: false
    });

    this.#setupRoutes();
  }

  #setupRoutes(): void {
    this.app.get('/radiko/:stationID', async (req: Request, res: Response): Promise<void> => {
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
        const icyMetadata = new IcyMetadata();
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
            } catch (e: any) {
              this.logger.warn(`Kill ffmpeg failed: ${e.code === 'ESRCH' ? 'Already exited' : e.message}`);
            }
          }
        });

        this.logger.info('JP_Radio::Streaming started');
      } catch (err) {
        this.logger.error('JP_Radio::Stream error', err);
        res.status(500).send('Internal server error');
      }
    });

    this.app.get('/radiko/', (_req, res) => {
      res.send("Hello, world. You're at the radiko_app index.");
    });
  }

  async radioStations(): Promise<BrowseResult> {
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
    const grouped: Record<string, BrowseItem[]> = {};

    await Promise.all(entries.map(async ([stationId, stationInfo]) => {
      const progData = await this.prg?.getCurProgram(stationId);
      const progTitle = progData ? ` - ${progData.pfm || ''} - ${progData.title || ''}` : '';
      const title = `${capitalize(stationInfo.AreaName)} / ${stationInfo.Name}${progTitle}`;

      const item: BrowseItem = {
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
    const lists: BrowseList[] = Object.entries(grouped).map(([regionName, items]) => ({
      title: regionName,
      availableListViews: ['grid', 'list'],
      items
    }));

    const result: BrowseResult = {
      navigation: {
        lists
      },
      uri: 'radiko'
    };

    return result;
  }

  async start(): Promise<void> {
    if (this.server) {
      this.logger.info('JP_Radio::Already started');
      this.commandRouter.pushToastMessage('info', 'JP Radio', 'すでに起動しています');
      return;
    }

    this.prg = new RdkProg(this.logger);
    this.rdk = new Radiko(this.port, this.logger, this.acct);
    await this.#init();

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
        .on('error', (err: any) => {
          this.logger.error('JP_Radio::App error:', err);
          this.commandRouter.pushToastMessage('error', 'JP Radio 起動失敗', err.message || 'エラー');
          reject(err);
        });
    });
  }

  async stop(): Promise<void> {
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

  async #init(): Promise<void> {
    if (this.rdk) await this.rdk.init(this.acct);
    await this.#pgupdate();
  }

  async #pgupdate(): Promise<void> {
    this.logger.info('JP_Radio::Updating program listings');
    await this.prg?.updatePrograms();
    await this.prg?.clearOldProgram();
  }
}
