import path from 'path';
import * as SystemUtils from './System';
import np from '../NowPlayingContext';
import chokidar from 'chokidar';

const MY_BACKGROUNDS_PATH = '/data/INTERNAL/NowPlayingPlugin/My Backgrounds';
const ACCEPT_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif'
];

class MyBackgroundMonitor {

  #images: Array<{name: string; path: string}>;
  #status: 'running' | 'stopped';
  #watcher: ReturnType<typeof chokidar['watch']> | null;
  #isSorted: boolean;

  constructor() {
    this.#images = [];
    this.#status = 'stopped';
    this.#watcher = null;
    this.#isSorted = false;
  }

  getImages() {
    if (this.#status !== 'running') {
      np.getLogger().warn('[now-playing] MyBackgroundMonitor is not running. Returning empty image list.');
      return [];
    }
    if (!this.#isSorted) {
      this.#sortImages();
    }
    return this.#images;
  }

  start() {
    if (!SystemUtils.dirExists(MY_BACKGROUNDS_PATH)) {
      np.getLogger().warn(`[now-playing] ${MY_BACKGROUNDS_PATH} does not exist. MyBackgroundMonitor will not start.`);
      return;
    }
    this.#watcher = chokidar.watch(MY_BACKGROUNDS_PATH);
    this.#watcher.on('add', this.#handleWatcherEvent.bind(this, 'add'));
    this.#watcher.on('unlink', this.#handleWatcherEvent.bind(this, 'unlink'));
    np.getLogger().warn(`[now-playing] MyBackgroundMonitor is now watching ${MY_BACKGROUNDS_PATH}`);
    this.#status = 'running';
  }

  async stop() {
    if (this.#watcher) {
      await this.#watcher.close();
      this.#watcher = null;
    }
    this.#images = [];
    this.#isSorted = false;
    this.#status = 'stopped';
    np.getLogger().warn('[now-playing] MyBackgroundMonitor stopped');
  }

  #handleWatcherEvent(event: string, pathToFile: string) {
    const { ext, base } = path.parse(pathToFile);

    if (!ACCEPT_EXTENSIONS.includes(ext)) {
      return;
    }
    np.getLogger().info(`[now-playing] MyBackgroundMonitor captured '${event}': ${base}`);

    switch (event) {
      case 'add':
        this.#images.push({
          name: base,
          path: path.resolve(pathToFile)
        });
        this.#isSorted = false;
        break;
      case 'unlink':
        const index = this.#images.findIndex((image) => image.name === base);
        if (index >= 0) {
          this.#images.splice(index, 1);
        }
        break;
      default:

    }
  }

  #sortImages() {
    this.#images.sort((img1, img2) => img1.name.localeCompare(img2.name));
    this.#isSorted = true;
  }
}

const myBackgroundMonitor = new MyBackgroundMonitor();

export default myBackgroundMonitor;
