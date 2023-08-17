import UserEntity from '../../../../entities/UserEntity';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class UserRenderer extends BaseRenderer<UserEntity> {
    renderToListItem(data: UserEntity): RenderedListItem | null;
    renderToHeader(data: UserEntity): RenderedHeader | null;
}
//# sourceMappingURL=UserRenderer.d.ts.map