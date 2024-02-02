import View from '../View';
import AlbumRenderer from './AlbumRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import TrackRenderer from './TrackRenderer';
import UserRenderer from './UserRenderer';

export enum RendererType {
  Album = 'Album',
  Playlist = 'Playlist',
  Track = 'Track',
  User = 'User'
}

export type RendererOf<T extends RendererType> =
  T extends RendererType.Album ? AlbumRenderer :
  T extends RendererType.Playlist ? PlaylistRenderer :
  T extends RendererType.Track ? TrackRenderer :
  T extends RendererType.User ? UserRenderer :
  never;

const RENDERER_TYPE_TO_CLASS: Record<RendererType, any> = {
  [RendererType.Album]: AlbumRenderer,
  [RendererType.Playlist]: PlaylistRenderer,
  [RendererType.Track]: TrackRenderer,
  [RendererType.User]: UserRenderer
};

export default class Renderer {

  static getInstance<T extends RendererType>(type: T, uri: string, currentView: View, previousViews: View[]): RendererOf<T> {
    if (RENDERER_TYPE_TO_CLASS[type]) {
      return new RENDERER_TYPE_TO_CLASS[type](uri, currentView, previousViews);
    }
    throw Error(`Renderer not found for type ${RendererType}`);
  }
}
