import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { UserEntity } from '../../../../entities/UserEntity';
export default class UserRenderer extends BaseRenderer<UserEntity> {
    renderToListItem(user: UserEntity): RenderedListItem | null;
    renderToHeader(user: UserEntity): RenderedHeader | null;
}
//# sourceMappingURL=UserRenderer.d.ts.map