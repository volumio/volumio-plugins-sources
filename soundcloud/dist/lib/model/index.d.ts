import AlbumModel from './AlbumModel';
import HistoryModel from './HistoryModel';
import MeModel from './MeModel';
import PlaylistModel from './PlaylistModel';
import SelectionModel from './SelectionModel';
import TrackModel from './TrackModel';
import UserModel from './UserModel';
export declare enum ModelType {
    Album = "Album",
    Playlist = "Playlist",
    Selection = "Selection",
    Track = "Track",
    User = "User",
    History = "History",
    Me = "Me"
}
export type ModelOf<T extends ModelType> = T extends ModelType.Album ? AlbumModel : T extends ModelType.Playlist ? PlaylistModel : T extends ModelType.Selection ? SelectionModel : T extends ModelType.Track ? TrackModel : T extends ModelType.User ? UserModel : T extends ModelType.History ? HistoryModel : T extends ModelType.Me ? MeModel : never;
export default class Model {
    static getInstance<T extends ModelType>(type: T): ModelOf<T>;
    static setAccessToken(value: string): void;
    static setLocale(value: string): void;
}
//# sourceMappingURL=index.d.ts.map