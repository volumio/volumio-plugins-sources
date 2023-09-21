import View from '../View';
import AlbumRenderer from './AlbumRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import TrackRenderer from './TrackRenderer';
import UserRenderer from './UserRenderer';
export declare enum RendererType {
    Album = "Album",
    Playlist = "Playlist",
    Track = "Track",
    User = "User"
}
export type RendererOf<T extends RendererType> = T extends RendererType.Album ? AlbumRenderer : T extends RendererType.Playlist ? PlaylistRenderer : T extends RendererType.Track ? TrackRenderer : T extends RendererType.User ? UserRenderer : never;
export default class Renderer {
    static getInstance<T extends RendererType>(type: T, uri: string, currentView: View, previousViews: View[]): RendererOf<T>;
}
//# sourceMappingURL=index.d.ts.map