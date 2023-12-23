import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { CloudcastEntity } from '../../../../entities/CloudcastEntity';
export default class CloudcastRenderer extends BaseRenderer<CloudcastEntity> {
    renderToListItem(cloudcast: CloudcastEntity, asType?: 'folder' | 'playShowItem', showMoreFromUser?: boolean): RenderedListItem | null;
    renderToHeader(cloudcast: CloudcastEntity): RenderedHeader | null;
}
//# sourceMappingURL=CloudcastRenderer.d.ts.map