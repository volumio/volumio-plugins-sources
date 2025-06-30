import AccountModel from './AccountModel';
import ConfigModel from './ConfigModel';
import EndpointModel from './EndpointModel';
import MusicItemModel from './MusicItemModel';
import PlaylistModel from './PlaylistModel';
import SearchModel from './SearchModel';
export declare enum ModelType {
    Account = "Account",
    Config = "Config",
    Endpoint = "Endpoint",
    Playlist = "Playlist",
    Search = "Search",
    MusicItem = "MusicItem"
}
export type ModelOf<T extends ModelType> = T extends ModelType.Account ? AccountModel : T extends ModelType.Config ? ConfigModel : T extends ModelType.Endpoint ? EndpointModel : T extends ModelType.Playlist ? PlaylistModel : T extends ModelType.Search ? SearchModel : T extends ModelType.MusicItem ? MusicItemModel : never;
export default class Model {
    static getInstance<T extends ModelType>(type: T): ModelOf<T>;
}
//# sourceMappingURL=index.d.ts.map