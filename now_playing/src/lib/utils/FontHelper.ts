import { readdirSync } from 'fs';
import np from '../NowPlayingContext';
import { dirExists } from './System';
import path from 'path';
import { UIConfigSelect } from '../config/UIConfig';
import { UIConfigSectionKey } from '../config/UIConfigSchema';

export const FONT_DIR = '/data/INTERNAL/NowPlayingPlugin/Fonts';
const FONT_EXTS = [
  '.ttf',
  '.otf',
  '.woff',
  '.woff2'
];

export default class FontHelper {

  static getFonts() {
    if (!dirExists(FONT_DIR)) {
      np.getLogger().warn(`[now-playing] Could not obtain font list: "${FONT_DIR}" does not exist`);
      return [];
    }
    let files;
    try {
      files = readdirSync(FONT_DIR);
    }
    catch (error) {
      np.getLogger().warn(`[now-playing] Error reading "${FONT_DIR}": ${error instanceof Error ? error.message : error}`);
      return [];
    }
    return files.filter((f) => FONT_EXTS.includes(path.parse(f).ext.toLowerCase()));
  }

  static fillUIConfSelectElements<K extends UIConfigSectionKey>(...elements: { el: UIConfigSelect<K>, value: string }[]) {
    const fonts = this.getFonts();
    const options = fonts.map((f) => ({ value: f, label: f }));
    for (const { el, value } of elements) {
      const selected = value ? options.find((o) => o.value === value) : null;
      el.options = [ this.#getUIConfSelectDefaultEntry(), ...options ];
      el.value = selected ? { ...selected } : this.#getUIConfSelectDefaultEntry();
    }
  }

  static #getUIConfSelectDefaultEntry() {
    return { value: '', label: np.getI18n('NOW_PLAYING_DEFAULT') };
  }
}
