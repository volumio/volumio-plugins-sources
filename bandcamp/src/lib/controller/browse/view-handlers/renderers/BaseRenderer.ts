import bandcamp from '../../../../BandcampContext';
import UIHelper, { UI_STYLES } from '../../../../util/UIHelper';
import View from '../View';

export interface RenderedListItem {
  service: 'bandcamp';
  type: 'folder' | 'song' | 'item-no-menu';
  title: string;
  albumart?: string | null;
  artist?: string | null;
  album?: string | null;
  duration?: number | null;
  uri: string;
  icon?: string;
  favorite?: boolean;
}

export interface RenderedHeader {
  service: 'bandcamp';
  type: 'album' | 'song';
  uri: string;
  albumart?: string | null;
  title?: string | null;
  album?: string | null;
  artist?: string | null;
  year?: number | string | null;
  duration?: string | null;
  genre?: string | null;
}

export default abstract class BaseRenderer<T> {

  #uri: string;
  #currentView: View;
  #previousViews: View[];

  constructor(uri: string, currentView: View, previousViews: View[]) {
    this.#uri = uri;
    this.#currentView = currentView;
    this.#previousViews = previousViews;
  }

  abstract renderToListItem(data: T, ...args: any[]): RenderedListItem | null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderToHeader(data: T): RenderedHeader | null {
    return null;
  }

  get uri(): string {
    return this.#uri;
  }

  get currentView(): View {
    return this.#currentView;
  }

  get previousViews(): View[] {
    return this.#previousViews;
  }

  protected addType(type: string, text: string) {
    return UIHelper.addTextBefore(text, bandcamp.getI18n(`BANDCAMP_${type.toUpperCase()}`), UI_STYLES.RESOURCE_TYPE);
  }

  // https://github.com/volumio/Volumio2-UI/blob/master/src/app/browse-music/browse-music.controller.js
  protected timeFormat(time: number | null): string | null {
    if (time) {
      // Hours, minutes and seconds
      const hrs = ~~(time / 3600);
      const mins = ~~((time % 3600) / 60);
      const secs = ~~time % 60;
      // Output like "1:01" or "4:03:59" or "123:03:59"
      let ret = '';
      if (hrs > 0) {
        ret += `${hrs}:${mins < 10 ? '0' : ''}`;
      }
      ret += `${mins}:${secs < 10 ? '0' : ''}`;
      ret += `${secs}`;
      return ret;
    }
    return null;
  }

  getStringFromIdNamePair(data: { id: string, name: string }[]): string {
    return data.reduce<string[]>((parts, d) => {
      parts.push(d.name);
      return parts;
    }, []).join(', ');
  }
}
