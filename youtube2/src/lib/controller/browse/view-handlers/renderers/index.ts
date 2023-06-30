import View from '../View';
import ChannelRenderer from './ChannelRenderer';
import EndpointLinkRenderer from './EndpointLinkRenderer';
import OptionRenderer from './OptionRenderer';
import OptionValueRenderer from './OptionValueRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import VideoRenderer from './VideoRenderer';

export enum RendererType {
  Channel = 'Channel',
  EndpointLink = 'EndpointLink',
  Option = 'Option',
  OptionValue = 'OptionValue',
  Playlist = 'Playlist',
  Video = 'Video'
}

const RENDERER_TYPE_TO_CLASS: Record<any, any> = {
  [RendererType.Channel]: ChannelRenderer,
  [RendererType.EndpointLink]: EndpointLinkRenderer,
  [RendererType.Option]: OptionRenderer,
  [RendererType.OptionValue]: OptionValueRenderer,
  [RendererType.Playlist]: PlaylistRenderer,
  [RendererType.Video]: VideoRenderer
};

export default class Renderer {

  static getInstance(type: RendererType.Channel, uri: string, currentView: View, previousViews: View[]): ChannelRenderer;
  static getInstance(type: RendererType.EndpointLink, uri: string, currentView: View, previousViews: View[]): EndpointLinkRenderer;
  static getInstance(type: RendererType.Option, uri: string, currentView: View, previousViews: View[]): OptionRenderer;
  static getInstance(type: RendererType.OptionValue, uri: string, currentView: View, previousViews: View[]): OptionValueRenderer;
  static getInstance(type: RendererType.Playlist, uri: string, currentView: View, previousViews: View[]): PlaylistRenderer;
  static getInstance(type: RendererType.Video, uri: string, currentView: View, previousViews: View[]): VideoRenderer;
  static getInstance(type: RendererType, uri: string, currentView: View, previousViews: View[]) {
    if (RENDERER_TYPE_TO_CLASS[type]) {
      return new RENDERER_TYPE_TO_CLASS[type](uri, currentView, previousViews);
    }
    throw Error(`Renderer not found for type ${RendererType}`);
  }
}
