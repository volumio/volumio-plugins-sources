import PlaylistEntity from '../../../../entities/PlaylistEntity';
import SetRenderer from './SetRenderer';
export default class PlaylistRenderer extends SetRenderer<PlaylistEntity> {
    protected getListItemUri(data: PlaylistEntity): string;
    protected getListItemAlbum(): string;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map