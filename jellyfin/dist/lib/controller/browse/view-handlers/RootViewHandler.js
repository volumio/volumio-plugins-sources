"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const ServerHelper_1 = __importDefault(require("../../../util/ServerHelper"));
class RootViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const renderer = this.getRenderer(entities_1.EntityType.Server);
        const serverConfEntries = ServerHelper_1.default.getServersFromConfig();
        const onlineServers = JellyfinContext_1.default.get('onlineServers', []);
        const displayedEntries = [];
        const listItems = onlineServers.reduce((result, server) => {
            const serverConfs = serverConfEntries.filter((conf) => ServerHelper_1.default.getConnectionUrl(conf.url) === server.connectionUrl);
            serverConfs.forEach((conf) => {
                // Where user adds double server entries to config (with same username + different
                // URLs pointing to same server), display only one.
                const connectionId = ServerHelper_1.default.generateConnectionId(conf.username, server.id);
                if (!displayedEntries.includes(connectionId)) {
                    const rendered = renderer.renderToListItem({
                        ...server,
                        username: conf.username
                    });
                    if (rendered) {
                        result.push(rendered);
                        displayedEntries.push(connectionId);
                    }
                }
            });
            return result;
        }, []);
        return {
            navigation: {
                prev: {
                    uri: '/'
                },
                lists: [
                    {
                        availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
                        items: listItems
                    }
                ]
            }
        };
    }
}
exports.default = RootViewHandler;
//# sourceMappingURL=RootViewHandler.js.map