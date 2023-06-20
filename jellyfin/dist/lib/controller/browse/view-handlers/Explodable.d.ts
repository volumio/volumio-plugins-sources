import { Song } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
export interface ExplodedTrackInfo {
    service: 'jellyfin';
    uri: string;
    albumart: string | null;
    artist?: string;
    album?: string;
    name: string;
    title: string;
    bitdepth?: string;
    samplerate?: string;
    trackType?: string;
    duration: number;
}
export interface AudioStreamMetadata {
    source: MediaSourceInfo;
    stream: MediaStream;
}
type Constructor<V extends View> = new (...args: any[]) => BaseViewHandler<V> & {
    getSongsOnExplode: () => Promise<Song[]>;
};
export declare function Explodable<V extends View, TBase extends Constructor<V>>(Base: TBase): {
    new (...args: any[]): {
        explode(): Promise<ExplodedTrackInfo[]>;
        _parseSongForExplode(song: Song): Promise<ExplodedTrackInfo | null>;
        _getAudioStreamMetadata(song: Song): AudioStreamMetadata | null;
        /**
         * Track uri is the canonical uri of the song:
         * jellyfin/{username}@{serverId}/song@songId={songId}
         */
        _getTrackUri(song: Song): string | null;
        "__#17@#uri": string;
        "__#17@#currentView": V;
        "__#17@#previousViews": View[];
        "__#17@#connection": import("../../../connection/ServerConnection").default | null;
        "__#17@#models": Record<any, import("../../../model/BaseModel").default>;
        "__#17@#renderers": Record<any, import("./renderer/BaseRenderer").default<import("../../../entities/BaseEntity").default> | null>;
        "__#17@#albumArtHandler": import("../../../util/AlbumArtHandler").default;
        browse(): Promise<import("./ViewHandler").RenderedPage>;
        readonly uri: string;
        readonly currentView: V;
        readonly previousViews: View[];
        getModel(type: ModelType.SortFilter): import("../../../model/filter/SortFilterModel").default;
        getModel(type: ModelType.FilterFilter): import("../../../model/filter/FilterFilterModel").default;
        getModel(type: ModelType.YearFilter): import("../../../model/filter/YearFilterModel").default;
        getModel(type: ModelType.GenreFilter): import("../../../model/filter/GenreFilterModel").default;
        getModel(type: ModelType.AZFilter): import("../../../model/filter/AZFilterModel").default;
        getModel(type: ModelType.Folder): import("../../../model/FolderModel").default;
        getModel(type: ModelType.Collection): import("../../../model/CollectionModel").default;
        getModel(type: ModelType.Song): import("../../../model/SongModel").default;
        getModel(type: ModelType.Genre): import("../../../model/GenreModel").default;
        getModel(type: ModelType.Artist): import("../../../model/ArtistModel").default;
        getModel(type: ModelType.Playlist): import("../../../model/PlaylistModel").default;
        getModel(type: ModelType.Album): import("../../../model/AlbumModel").default;
        getModel(type: ModelType.UserView): import("../../../model/UserViewModel").default;
        getRenderer(type: import("../../../entities").EntityType.Album): import("./renderer/AlbumRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Artist): import("./renderer/ArtistRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Collection): import("./renderer/CollectionRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Folder): import("./renderer/FolderRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Genre): import("./renderer/GenreRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Playlist): import("./renderer/PlaylistRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Server): import("./renderer/ServerRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.Song): import("./renderer/SongRenderer").default;
        getRenderer(type: import("../../../entities").EntityType.UserView): import("./renderer/UserViewRenderer").default;
        constructPrevUri(): string;
        constructNextUri(startIndex?: number | undefined, nextView?: View | undefined): string;
        constructNextPageItem(nextUri: string, title?: string | undefined): import("./renderer/BaseRenderer").RenderedListItem;
        constructMoreItem(moreUri: string, title?: string | undefined): import("./renderer/BaseRenderer").RenderedListItem;
        getModelQueryParams(bundle?: Record<string, any> | undefined): import("../../../model/BaseModel").GetItemsParams;
        getAlbumArt<T extends import("../../../entities/BaseEntity").default>(item: T): string;
        readonly serverConnection: import("../../../connection/ServerConnection").default | null;
        setPageTitle(pageContents: import("./ViewHandler").RenderedPageContents): Promise<import("./ViewHandler").RenderedPageContents>;
        getSongsOnExplode: () => Promise<Song[]>;
    };
} & TBase;
export {};
//# sourceMappingURL=Explodable.d.ts.map