import View from '../View';
import CloudcastRenderer from './CloudcastRenderer';
import LiveStreamRenderer from './LiveStreamRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import SlugRenderer from './SlugRenderer';
import UserRenderer from './UserRenderer';
export declare enum RendererType {
    Cloudcast = "Cloudcast",
    Playlist = "Playlist",
    Slug = "Slug",
    User = "User",
    LiveStream = "LiveStream"
}
export default class Renderer {
    static getInstance(type: RendererType.Cloudcast, uri: string, currentView: View, previousViews: View[]): CloudcastRenderer;
    static getInstance(type: RendererType.Playlist, uri: string, currentView: View, previousViews: View[]): PlaylistRenderer;
    static getInstance(type: RendererType.Slug, uri: string, currentView: View, previousViews: View[]): SlugRenderer;
    static getInstance(type: RendererType.User, uri: string, currentView: View, previousViews: View[]): UserRenderer;
    static getInstance(type: RendererType.LiveStream, uri: string, currentView: View, previousViews: View[]): LiveStreamRenderer;
}
//# sourceMappingURL=index.d.ts.map