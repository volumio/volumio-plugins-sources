import { EntityType } from '../../../../entities';
import AlbumArtHandler from '../../../../util/AlbumArtHandler';
import View from '../View';
import AlbumRenderer from './AlbumRenderer';
import ArtistRenderer from './ArtistRenderer';
import CollectionRenderer from './CollectionRenderer';
import FolderRenderer from './FolderRenderer';
import GenreRenderer from './GenreRenderer';
import PlaylistRenderer from './PlaylistRenderer';
import ServerRenderer from './ServerRenderer';
import SongRenderer from './SongRenderer';
import UserViewRenderer from './UserViewRenderer';
export default class Renderer {
    static getInstance(type: EntityType.Album, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): AlbumRenderer;
    static getInstance(type: EntityType.Artist, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): ArtistRenderer;
    static getInstance(type: EntityType.Collection, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): CollectionRenderer;
    static getInstance(type: EntityType.Folder, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): FolderRenderer;
    static getInstance(type: EntityType.Genre, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): GenreRenderer;
    static getInstance(type: EntityType.Playlist, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): PlaylistRenderer;
    static getInstance(type: EntityType.Server, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): ServerRenderer;
    static getInstance(type: EntityType.Song, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): SongRenderer;
    static getInstance(type: EntityType.UserView, uri: string, currentView: View, previousViews: View[], albumArtHandler: AlbumArtHandler): UserViewRenderer;
}
//# sourceMappingURL=index.d.ts.map