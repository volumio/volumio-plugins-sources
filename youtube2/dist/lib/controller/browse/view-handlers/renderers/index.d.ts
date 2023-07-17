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
export type RendererOf<T extends RendererType> = T extends RendererType.Channel ? ChannelRenderer : T extends RendererType.EndpointLink ? EndpointLinkRenderer : T extends RendererType.Option ? OptionRenderer : T extends RendererType.OptionValue ? OptionValueRenderer : T extends RendererType.Playlist ? PlaylistRenderer : T extends RendererType.Video ? VideoRenderer : never;
export default class Renderer {
    static getInstance<T extends RendererType>(type: T, uri: string, currentView: View, previousViews: View[]): RendererOf<T>;
}
//# sourceMappingURL=index.d.ts.map