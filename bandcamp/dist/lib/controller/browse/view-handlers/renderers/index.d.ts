import View from '../View';
import AlbumRenderer from './AlbumRenderer';
import ArticleRenderer from './ArticleRenderer';
import BandRenderer from './BandRenderer';
import SearchResultRenderer from './SearchResultParser';
import ShowRenderer from './ShowRenderer';
import TagRenderer from './TagRenderer';
import TrackRenderer from './TrackRenderer';
export declare enum RendererType {
    Album = "Album",
    Article = "Article",
    Band = "Band",
    SearchResult = "Discover",
    Show = "Fan",
    Tag = "Search",
    Track = "Show"
}
export default class Renderer {
    static getInstance(type: RendererType.Album, uri: string, currentView: View, previousViews: View[]): AlbumRenderer;
    static getInstance(type: RendererType.Article, uri: string, currentView: View, previousViews: View[]): ArticleRenderer;
    static getInstance(type: RendererType.Band, uri: string, currentView: View, previousViews: View[]): BandRenderer;
    static getInstance(type: RendererType.SearchResult, uri: string, currentView: View, previousViews: View[]): SearchResultRenderer;
    static getInstance(type: RendererType.Show, uri: string, currentView: View, previousViews: View[]): ShowRenderer;
    static getInstance(type: RendererType.Tag, uri: string, currentView: View, previousViews: View[]): TagRenderer;
    static getInstance(type: RendererType.Track, uri: string, currentView: View, previousViews: View[]): TrackRenderer;
}
//# sourceMappingURL=index.d.ts.map