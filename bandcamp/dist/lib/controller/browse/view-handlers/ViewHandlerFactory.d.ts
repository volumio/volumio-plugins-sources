import BaseViewHandler from './BaseViewHandler';
import View from './View';
export default class ViewHandlerFactory {
    static getHandler<V extends View>(uri: string): BaseViewHandler<V>;
}
//# sourceMappingURL=ViewHandlerFactory.d.ts.map