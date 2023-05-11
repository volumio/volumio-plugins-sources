import BaseEntity from '../../../../entities/BaseEntity';
import AlbumArtHandler from '../../../../util/AlbumArtHandler';
import View from '../View';

export interface RenderedListItem {
  service: 'jellyfin';
  type: 'folder' | 'song' | 'streaming-category' | 'jellyfin-filter' | 'jellyfin-filter-option';
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
  service: 'jellyfin';
  type: 'album' | 'song';
  uri: string;
  albumart: string | null;
  album?: string | null;
  artist?: string | null;
  year?: number | string | null;
  duration?: string | null;
  genre?: string | null;
}

export default abstract class BaseRenderer<T extends BaseEntity> {

  #uri: string;
  #currentView: View;
  #previousViews: View[];
  #albumArtHandler: AlbumArtHandler;

  constructor(uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler) {
    this.#uri = uri;
    this.#currentView = currentView;
    this.#previousViews = previousViews;
    this.#albumArtHandler = albumArtHandler;
  }

  abstract renderToListItem(data: T, ...args: any[]): RenderedListItem | null;

  renderToHeader(data: T): RenderedHeader | null {
    return {
      'uri': this.#uri,
      'service': 'jellyfin',
      'type': 'song',
      'album': data.name,
      'albumart': this.getAlbumArt(data)
    };
  }

  protected getAlbumArt(data: T) {
    return this.#albumArtHandler.getAlbumArtUri(data);
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
