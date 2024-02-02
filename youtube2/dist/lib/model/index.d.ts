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
export type ModelOf<T extends ModelType> = T extends ModelType.Account ? AccountModel : T extends ModelType.Config ? ConfigModel : T extends ModelType.Endpoint ? EndpointModel : T extends ModelType.Playlist ? PlaylistModel : T extends ModelType.Search ? SearchModel : T extends ModelType.Video ? VideoModel : T extends ModelType.Root ? RootModel : never;
export default class Model {
    static getInstance<T extends ModelType>(type: T): ModelOf<T>;
}
//# sourceMappingURL=index.d.ts.map