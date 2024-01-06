import ConnectionManager from '../../../connection/ConnectionManager';
import ServerConnection from '../../../connection/ServerConnection';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
export default class ViewHandlerFactory {
    static getHandler<V extends View>(uri: string, connection: ServerConnection): Promise<BaseViewHandler<V>>;
    static getHandler<V extends View>(uri: string, connectionManager: ConnectionManager): Promise<BaseViewHandler<V>>;
}
//# sourceMappingURL=ViewHandlerFactory.d.ts.map