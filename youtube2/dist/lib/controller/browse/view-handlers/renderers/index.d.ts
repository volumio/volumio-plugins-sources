import View from '../View';
import ChannelRenderer from './ChannelRenderer';
import EndpointLinkRenderer from './EndpointLinkRenderer';
import OptionRenderer from './OptionRenderer';
import OptionValueRenderer from './OptionValueRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import VideoRenderer from './VideoRenderer';
export declare enum RendererType {
    Channel = "Channel",
    EndpointLink = "EndpointLink",
    Option = "Option",
    OptionValue = "OptionValue",
    Playlist = "Playlist",
    Video = "Video"
}
export default class Renderer {
    static getInstance(type: RendererType.Channel, uri: string, currentView: View, previousViews: View[]): ChannelRenderer;
    static getInstance(type: RendererType.EndpointLink, uri: string, currentView: View, previousViews: View[]): EndpointLinkRenderer;
    static getInstance(type: RendererType.Option, uri: string, currentView: View, previousViews: View[]): OptionRenderer;
    static getInstance(type: RendererType.OptionValue, uri: string, currentView: View, previousViews: View[]): OptionValueRenderer;
    static getInstance(type: RendererType.Playlist, uri: string, currentView: View, previousViews: View[]): PlaylistRenderer;
    static getInstance(type: RendererType.Video, uri: string, currentView: View, previousViews: View[]): VideoRenderer;
}
//# sourceMappingURL=index.d.ts.map