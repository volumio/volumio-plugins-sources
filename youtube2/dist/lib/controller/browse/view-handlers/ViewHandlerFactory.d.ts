import type BaseViewHandler from './BaseViewHandler';
import type View from './View';
export default class ViewHandlerFactory {
    static getHandler<V extends View>(uri: string): BaseViewHandler<V>;
}
//# sourceMappingURL=ViewHandlerFactory.d.ts.map