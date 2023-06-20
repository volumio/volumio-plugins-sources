import Server from '../../../../entities/Server';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class ServerRenderer extends BaseRenderer<Server & {
    username: string;
}> {
    renderToListItem(data: Server & {
        username: string;
    }): RenderedListItem | null;
    renderToHeader(): RenderedHeader | null;
}
//# sourceMappingURL=ServerRenderer.d.ts.map