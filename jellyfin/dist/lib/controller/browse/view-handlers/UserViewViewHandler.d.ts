import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface UserViewView extends View {
    name: 'userViews';
    serverId: string;
    username: string;
}
export default class UserViewViewHandler extends BaseViewHandler<UserViewView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=UserViewViewHandler.d.ts.map