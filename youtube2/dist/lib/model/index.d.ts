import AccountModel from './AccountModel';
import ConfigModel from './ConfigModel';
import EndpointModel from './EndpointModel';
import PlaylistModel from './PlaylistModel';
import RootModel from './RootModel';
import SearchModel from './SearchModel';
import VideoModel from './VideoModel';
export declare enum ModelType {
    Account = "Account",
    Config = "Config",
    Endpoint = "Endpoint",
    Playlist = "Playlist",
    Search = "Search",
    Video = "Video",
    Root = "Root"
}
export default class Model {
    static getInstance(type: ModelType.Account): AccountModel;
    static getInstance(type: ModelType.Config): ConfigModel;
    static getInstance(type: ModelType.Endpoint): EndpointModel;
    static getInstance(type: ModelType.Playlist): PlaylistModel;
    static getInstance(type: ModelType.Search): SearchModel;
    static getInstance(type: ModelType.Video): VideoModel;
    static getInstance(type: ModelType.Root): RootModel;
}
//# sourceMappingURL=index.d.ts.map