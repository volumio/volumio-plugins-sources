import View from '../View';

export interface RenderedListItem {
  service: 'ytmusic';
  type: 'folder' | 'song' | 'album' | 'item-no-menu';
  tracknumber?: string;
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
  service: 'ytmusic';
  type: 'album' | 'song' | 'playlist';
  uri: string;
  albumart?: string | null;
  title?: string | null;
  album?: string | null;
  artist?: string | null;
  year?: number | string | null;
  duration?: string | null;
  genre?: string | null;
}

export default abstract class BaseRenderer<I, H = I> {

  #uri: string;
  #currentView: View;
  #previousViews: View[];

  constructor(uri: string, currentView: View, previousViews: View[]) {
    this.#uri = uri;
    this.#currentView = currentView;
    this.#previousViews = previousViews;
  }

  abstract renderToListItem(data: I, ...args: any[]): RenderedListItem | null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderToHeader(data: H): RenderedHeader | null {
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
}
