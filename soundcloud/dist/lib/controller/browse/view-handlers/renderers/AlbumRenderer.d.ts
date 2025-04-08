import AlbumEntity from '../../../../entities/AlbumEntity';
import SetRenderer from './SetRenderer';
export default class AlbumRenderer extends SetRenderer<AlbumEntity> {
    protected getListItemUri(data: AlbumEntity): string;
    protected getListItemAlbum(): string;
}
//# sourceMappingURL=AlbumRenderer.d.ts.map