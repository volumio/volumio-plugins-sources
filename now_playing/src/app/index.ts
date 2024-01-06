import express from 'express';
import cors from 'cors';
import http from 'http';
import router from './Router';
import np from '../lib/NowPlayingContext';

const app = express();

app.use(cors());
app.use(express.json());
//App.use(express.urlencoded({ extended: false }));

// Routes
app.use(router);
app.use('/assets', express.static(`${__dirname}/assets`));
app.use('/genius_setup', express.static(`${__dirname}/views/genius_setup.html`));
app.use('/geo_coord_setup', express.static(`${__dirname}/views/geo_coord_setup.html`));
app.use('/preview', express.static(`${__dirname}/preview/build`));
app.use(express.static(`${__dirname}/client/build`));
app.use((_req, _res, next) => {
  next(404);
});
app.use((err: any, _req: express.Request, res: express.Response) => {
  np.getLogger().error(np.getErrorMessage('[now-playing] App error:', err));
  res.status(err.status || 500);
  res.sendStatus(err);
});

let server: http.Server | null = null;

export function start() {
  if (server) {
    np.getLogger().info('[now-playing] App already started');
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const port = np.getConfigValue('port');
    server = app.listen(port, () => {
      np.getLogger().info(`[now-playing] App is listening on port ${port}.`);
      resolve();
    })
      .on('error', (err) => {
        np.getLogger().error(np.getErrorMessage('[now-playing] App error:', err));
        reject(err);
      });
  });
}

export function stop() {
  if (server) {
    server.close();
    server = null;
  }
}
