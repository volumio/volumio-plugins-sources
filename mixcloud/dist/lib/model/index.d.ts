import CloudcastModel from './CloudcastModel';
import DiscoverModel from './DiscoverModel';
import PlaylistModel from './PlaylistModel';
import TagModel from './TagModel';
import UserModel from './UserModel';
import LiveStreamModel from './LiveStreamModel';
export declare enum ModelType {
    Cloudcast = "Cloudcast",
    Discover = "Discover",
    Playlist = "Playlist",
    Tag = "Tag",
    User = "User",
    LiveStream = "LiveStream"
}
export default class Model {
    static getInstance(type: ModelType.Cloudcast): CloudcastModel;
    static getInstance(type: ModelType.Discover): DiscoverModel;
    static getInstance(type: ModelType.Playlist): PlaylistModel;
    static getInstance(type: ModelType.Tag): TagModel;
    static getInstance(type: ModelType.User): UserModel;
    static getInstance(type: ModelType.LiveStream): LiveStreamModel;
    static reset(): void;
    static clearLibCache(): void;
}
//# sourceMappingURL=index.d.ts.map