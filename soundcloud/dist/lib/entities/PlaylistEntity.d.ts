import SetEntity from './SetEntity';
export interface RegularPlaylistEntity extends SetEntity {
    type: 'playlist';
    id?: number;
}
export interface SystemPlaylistEntity extends SetEntity {
    type: 'system-playlist';
    id?: string | null;
    urn?: string | null;
}
type PlaylistEntity = RegularPlaylistEntity | SystemPlaylistEntity;
export default PlaylistEntity;
//# sourceMappingURL=PlaylistEntity.d.ts.map