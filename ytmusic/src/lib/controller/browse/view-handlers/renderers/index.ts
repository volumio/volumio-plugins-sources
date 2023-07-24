import View from '../View';
import ChannelRenderer from './ChannelRenderer';
import EndpointLinkRenderer from './EndpointLinkRenderer';
import OptionRenderer from './OptionRenderer';
import OptionValueRenderer from './OptionValueRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import MusicItemRenderer from './MusicItemRenderer';
import AlbumRenderer from './AlbumRenderer';

export enum RendererType {
  Channel = 'Channel',
  EndpointLink = 'EndpointLink',
  Option = 'Option',
  OptionValue = 'OptionValue',
  Album = 'Album',
  Playlist = 'Playlist',
  MusicItem = 'MusicItem'
}

export type RendererOf<T extends RendererType> =
  T extends RendererType.Channel ? ChannelRenderer :
  T extends RendererType.EndpointLink ? EndpointLinkRenderer :
  T extends RendererType.Option ? OptionRenderer :
  T extends RendererType.OptionValue ? OptionValueRenderer :
  T extends RendererType.Album ? AlbumRenderer :
  T extends RendererType.Playlist ? PlaylistRenderer :
  T extends RendererType.MusicItem ? MusicItemRenderer : never;

const RENDERER_TYPE_TO_CLASS: Record<RendererType, any> = {
  [RendererType.Channel]: ChannelRenderer,
  [RendererType.EndpointLink]: EndpointLinkRenderer,
  [RendererType.Option]: OptionRenderer,
  [RendererType.OptionValue]: OptionValueRenderer,
  [RendererType.Album]: AlbumRenderer,
  [RendererType.Playlist]: PlaylistRenderer,
  [RendererType.MusicItem]: MusicItemRenderer
};

export default class Renderer {

  static getInstance<T extends RendererType>(type: T, uri: string, currentView: View, previousViews: View[]): RendererOf<T> {
    if (RENDERER_TYPE_TO_CLASS[type]) {
      return new RENDERER_TYPE_TO_CLASS[type](uri, currentView, previousViews);
    }
    throw Error(`Renderer not found for type ${RendererType}`);
  }
}
