import AlbumModel from './AlbumModel';
import ArticleModel from './ArticleModel';
import BandModel from './BandModel';
import DiscoverModel from './DiscoverModel';
import FanModel from './FanModel';
import SearchModel from './SearchModel';
import ShowModel from './ShowModel';
import TagModel from './TagModel';
import TrackModel from './TrackModel';
export declare enum ModelType {
    Album = "Album",
    Article = "Article",
    Band = "Band",
    Discover = "Discover",
    Fan = "Fan",
    Search = "Search",
    Show = "Show",
    Tag = "Tag",
    Track = "Track"
}
export default class Model {
    static getInstance(type: ModelType.Album): AlbumModel;
    static getInstance(type: ModelType.Article): ArticleModel;
    static getInstance(type: ModelType.Band): BandModel;
    static getInstance(type: ModelType.Discover): DiscoverModel;
    static getInstance(type: ModelType.Fan): FanModel;
    static getInstance(type: ModelType.Search): SearchModel;
    static getInstance(type: ModelType.Show): ShowModel;
    static getInstance(type: ModelType.Tag): TagModel;
    static getInstance(type: ModelType.Track): TrackModel;
    static setCookie(value?: string | null): void;
    static get cookie(): string | null | undefined;
    static reset(): void;
    static clearLibCache(): void;
    static ensureStreamURL(url: string): Promise<string | null>;
}
//# sourceMappingURL=index.d.ts.map